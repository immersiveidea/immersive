import PouchDB from 'pouchdb';
import {DiagramEntity, DiagramEventType} from "../diagram/types/diagramEntity";
import {Observable} from "@babylonjs/core";
import axios from "axios";
import {DiagramEventObserverMask, DiagramManager} from "../diagram/diagramManager";
import log, {Logger} from "loglevel";
import {ascii_to_hex} from "./functions/hexFunctions";
import {getPath} from "../util/functions/getPath";

const logger: Logger = log.getLogger('PouchdbPersistenceManager');
export class PouchdbPersistenceManager {
    onDBUpdateObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    onDBRemoveObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();

    private db: PouchDB;
    private remote: PouchDB;
    private user: string;

    constructor() {

    }
    public setDiagramManager(diagramManager: DiagramManager) {
        diagramManager.onDiagramEventObservable.add((evt) => {
            logger.debug(evt);
            switch (evt.type) {
                case DiagramEventType.REMOVE:
                    this.remove(evt.entity.id);
                    break;
                case DiagramEventType.ADD:
                case DiagramEventType.MODIFY:
                case DiagramEventType.DROP:
                    this.upsert(evt.entity);
                    break;
                default:
                    logger.warn('unknown diagram event type', evt);
            }
        }, DiagramEventObserverMask.TO_DB);

        this.onDBUpdateObservable.add((evt) => {
            logger.debug(evt);
            diagramManager.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: evt
            }, DiagramEventObserverMask.FROM_DB);
        });

        this.onDBRemoveObservable.add((entity) => {
            logger.debug(entity);
            diagramManager.onDiagramEventObservable.notifyObservers(
                {type: DiagramEventType.REMOVE, entity: entity}, DiagramEventObserverMask.FROM_DB);
        });
    }

    public async remove(id: string) {
        if (!id) {
            return;
        }
        try {
            const doc = await this.db.get(id);
            this.db.remove(doc);
        } catch (err) {
            logger.error(err);
        }
    }

    public async upsert(entity: DiagramEntity) {
        if (!entity) {
            return;
        }
        try {
            const doc = await this.db.get(entity.id);
            if (doc) {
                const newDoc = {...doc, ...entity};
                this.db.put(newDoc);
            }
        } catch (err) {
            if (err.status == 404) {
                try {
                    const newEntity = {...entity, _id: entity.id};
                    this.db.put(newEntity);
                } catch (err2) {
                    logger.error(err2);
                }
            } else {
                logger.error(err);
            }
        }
    }

    public async initialize() {
        if (!await this.initLocal()) {
            return;
        }
        await this.sendLocalDataToScene();
    }

    private async initLocal(): Promise<boolean> {
        try {
            let current = getPath() || 'public';
            this.db = new PouchDB(current);
            await this.beginSync(current);
            return true;
        } catch (err) {
            logger.error(err);
            logger.error('cannot initialize pouchdb for sync');
            return false;
        }
    }

    private async sendLocalDataToScene() {
        try {
            const all = await this.db.allDocs({include_docs: true});
            for (const entity of all.rows) {
                logger.debug(entity.doc);
                this.onDBUpdateObservable.notifyObservers(entity.doc, 1);
            }
        } catch (err) {
            logger.error(err);
        }
    }


    sync() {

    }

    private syncDoc(info) {
        logger.debug(info);
        if (info.direction == 'pull') {
            const docs = info.change.docs;
            for (const doc of docs) {
                logger.debug(doc);
                if (doc._deleted) {
                    logger.debug('Delete', doc);
                    this.onDBRemoveObservable.notifyObservers({id: doc._id, template: doc.template}, 1);
                } else {
                    this.onDBUpdateObservable.notifyObservers(doc, 1);
                }

            }
        }
    }

    private async beginSync(localName: string) {
        try {
            const userHex = ascii_to_hex(localName);
            const remoteDbName = 'userdb-' + userHex;
            const remoteUserName = localName;
            const password = localName;
            const dbs = await axios.get(import.meta.env.VITE_SYNCDB_ENDPOINT + 'list');
            logger.debug(dbs.data);
            if (dbs.data.indexOf(remoteDbName) == -1) {
                logger.warn('sync target missing attempting to create');
                const newdb = await axios.post(import.meta.env.VITE_CREATE_ENDPOINT,
                    {
                        "_id": "org.couchdb.user:" + localName,
                        "name": localName,
                        "password": localName,
                        "roles": ["readers"],
                        "type": "user"
                    }
                );
                if (newdb.status == 200) {
                    logger.info('sync target created');
                } else {
                    return;
                }
            }
            const userEndpoint: string = import.meta.env.VITE_USER_ENDPOINT
            logger.debug(userEndpoint);
            logger.debug(remoteDbName);
            const target = await axios.get(userEndpoint);
            if (target.status != 200) {
                logger.info(target.statusText);
                return;
            }
            if (target.data && target.data.userCtx) {
                if (!target.data.userCtx.name || target.data.userCtx.name != remoteUserName) {
                    const buildTarget = await axios.post(userEndpoint,
                        {username: remoteUserName, password: password});
                    if (buildTarget.status != 200) {
                        logger.info(buildTarget.statusText);
                        return;
                    } else {
                        this.user = buildTarget.data.userCtx;
                        logger.debug(this.user);
                    }
                }
            }


            const remoteEndpoint: string = import.meta.env.VITE_SYNCDB_ENDPOINT;
            logger.debug(remoteEndpoint + remoteDbName);
            this.remote = new PouchDB(remoteEndpoint + remoteDbName,
                {auth: {username: remoteUserName, password: password}, skip_setup: true});
            const dbInfo = await this.remote.info();
            logger.debug(dbInfo);
            this.db.sync(this.remote, {live: true, retry: true})
                .on('change', (info) => {
                    this.syncDoc(info)
                })
                .on('active', function (info) {
                    logger.debug('sync active', info)
                })
                .on('paused', function (info) {
                    logger.debug('sync paused', info)
                })
                .on('error', function (err) {
                    logger.error('sync error', err)
                });
        } catch (err) {
            logger.error(err);
        }
    }
}


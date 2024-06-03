import PouchDB from 'pouchdb';
import {DiagramEntity, DiagramEventType} from "../diagram/types/diagramEntity";
import {Observable} from "@babylonjs/core";
import axios from "axios";
import {DiagramManager} from "../diagram/diagramManager";
import log, {Logger} from "loglevel";
import {ascii_to_hex} from "./functions/hexFunctions";
import {getPath} from "../util/functions/getPath";
import {DiagramEventObserverMask} from "../diagram/types/diagramEventObserverMask";
import {syncDoc} from "./functions/syncDoc";
import {checkDb} from "./functions/checkDb";

export class PouchdbPersistenceManager {
    private _logger: Logger = log.getLogger('PouchdbPersistenceManager');
    onDBUpdateObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    onDBRemoveObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();

    private db: PouchDB;
    private remote: PouchDB;
    private user: string;


    constructor() {

    }
    public setDiagramManager(diagramManager: DiagramManager) {
        diagramManager.onDiagramEventObservable.add((evt) => {
            this._logger.debug(evt);
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
                    this._logger.warn('unknown diagram event type', evt);
            }
        }, DiagramEventObserverMask.TO_DB);

        this.onDBUpdateObservable.add((evt) => {
            this._logger.debug(evt);
            if (evt.id != 'metadata') {
                diagramManager.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: evt
                }, DiagramEventObserverMask.FROM_DB);
            } else {

            }

        });

        this.onDBRemoveObservable.add((entity) => {
            this._logger.debug(entity);
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
            this._logger.error(err);
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
                    this._logger.error(err2);
                }
            } else {
                this._logger.error(err);
            }
        }
    }

    public async initialize() {
        if (!await this.initLocal()) {
            return;
        }
        await this.sendLocalDataToScene();
    }

    private async setupMetadata(current: string) {
        try {
            const doc = await this.db.get('metadata');
            if (doc && doc.friendly) {
                localStorage.setItem(current, doc.friendly);
            }
            if (doc && doc.camera) {

            }
        } catch (err) {
            if (err.status == 404) {
                this._logger.debug('no metadata found');
                const friendly = localStorage.getItem(current);
                if (friendly) {
                    this._logger.debug('local friendly name found ', friendly, ' setting metadata');
                    const newDoc = {_id: 'metadata', friendly: friendly};
                    await this.db.put(newDoc);
                } else {
                    this._logger.debug('no friendly name found');
                }
            }
        }
    }

    private async initLocal(): Promise<boolean> {
        try {

            let sync = false;
            let current = getPath();
            if (current && current != 'localdb') {
                sync = true;
            } else {
                current = 'localdb';
            }
            this.db = new PouchDB(current, {auto_compaction: true});
            await this.db.compact();
            if (sync) {
                await this.setupMetadata(current);
                await this.beginSync(current);
            }
            return true;
        } catch (err) {
            this._logger.error(err);
            this._logger.error('cannot initialize pouchdb for sync');
            return false;
        }
    }

    private async sendLocalDataToScene() {
        const clear = localStorage.getItem('clearLocal');
        try {

            const all = await this.db.allDocs({include_docs: true});
            for (const entity of all.rows) {
                this._logger.debug(entity.doc);
                if (clear) {
                    this.remove(entity.id);
                } else {
                    this.onDBUpdateObservable.notifyObservers(entity.doc, DiagramEventObserverMask.FROM_DB);
                }

            }
            if (clear) {
                localStorage.removeItem('clearLocal');
            }
        } catch (err) {
            this._logger.error(err);
        }
    }

    private async beginSync(localName: string) {
        try {
            const userHex = ascii_to_hex(localName);
            const remoteDbName = 'userdb-' + userHex;
            const remoteUserName = localName;
            const password = localName;

            if (await checkDb(localName, remoteDbName) == false) {
                return;
            }

            const userEndpoint: string = import.meta.env.VITE_USER_ENDPOINT
            this._logger.debug(userEndpoint);
            this._logger.debug(remoteDbName);
            const target = await axios.get(userEndpoint);
            if (target.status != 200) {
                this._logger.warn(target.statusText);
                return;
            }
            if (target.data && target.data.userCtx) {
                if (!target.data.userCtx.name || target.data.userCtx.name != remoteUserName) {
                    const buildTarget = await axios.post(userEndpoint,
                        {username: remoteUserName, password: password});
                    if (buildTarget.status != 200) {
                        this._logger.info(buildTarget.statusText);
                        return;
                    } else {
                        this.user = buildTarget.data.userCtx;
                        this._logger.debug(this.user);
                    }
                }
            }

            const remoteEndpoint: string = import.meta.env.VITE_SYNCDB_ENDPOINT;
            this._logger.debug(remoteEndpoint + remoteDbName);
            this.remote = new PouchDB(remoteEndpoint + remoteDbName,
                {auth: {username: remoteUserName, password: password}, skip_setup: true});
            const dbInfo = await this.remote.info();
            this._logger.debug(dbInfo);
            this.db.sync(this.remote, {live: true, retry: true})
                .on('change', (info) => {
                    syncDoc(info, this.onDBRemoveObservable, this.onDBUpdateObservable);
                })
                .on('active', (info) => {
                    this._logger.debug('sync active', info)
                })
                .on('paused', (info) => {
                    this._logger.debug('sync paused', info)
                })
                .on('error', (err) => {
                    this._logger.error('sync error', err)
                });
        } catch (err) {
            this._logger.error(err);
        }
    }
}


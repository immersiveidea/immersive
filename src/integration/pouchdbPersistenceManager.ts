import PouchDB from 'pouchdb';
import {DiagramEntity, DiagramEventType} from "../diagram/types/diagramEntity";
import {Color3, Observable} from "@babylonjs/core";
import axios from "axios";
import {DiagramManager} from "../diagram/diagramManager";
import log, {Logger} from "loglevel";

const logger: Logger = log.getLogger('PouchdbPersistenceManager');
export class PouchdbPersistenceManager {
    updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    removeObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();

    private db: PouchDB;
    private remote: PouchDB;
    private user: string;

    constructor() {

    }

    public setDiagramManager(diagramManager: DiagramManager) {
        diagramManager.onDiagramEventObservable.add((evt) => {
            logger.debug(evt);
            switch (evt.type) {
                case DiagramEventType.CHANGECOLOR:
                    this.changeColor(evt.oldColor, evt.newColor);
                    break;
                case DiagramEventType.ADD:
                    this.add(evt.entity);
                    break;
                case DiagramEventType.REMOVE:
                    this.remove(evt.entity.id);
                    break;
                case DiagramEventType.MODIFY:
                case DiagramEventType.DROP:
                    this.modify(evt.entity);
                    break;
                default:
                    logger.warn('unknown diagram event type', evt);
            }
        }, 2);
        this.updateObserver.add((evt) => {
            logger.debug(evt);
            diagramManager.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: evt
            }, 1);
        });
        this.removeObserver.add((entity) => {
            logger.debug(entity);
            diagramManager.onDiagramEventObservable.notifyObservers(
                {type: DiagramEventType.REMOVE, entity: entity}, 1);
        });
    }

    public async add(entity: DiagramEntity) {
        if (!entity) {
            return;
        }
        const newEntity = {...entity, _id: entity.id};
        try {
            this.db.put(newEntity);
        } catch (err) {
            logger.error(err);
        }
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

    public async modify(entity: DiagramEntity) {
        if (!entity) {
            return;
        }
        try {
            const doc = await this.db.get(entity.id);
            const newDoc = {...doc, ...entity};
            this.db.put(newDoc);

        } catch (err) {
            logger.error(err);
        }
    }

    public async getNewRelicData(): Promise<any[]> {
        return [];
    }

    public async setNewRelicData(data: any[]): Promise<any> {
        return data;
    }

    public async initialize() {
        try {
            let current = this.getPath();

            if (current) {
                this.db = new PouchDB(current);
            } else {
                current = 'public';
                this.db = new PouchDB(current);
            }

            await this.beginSync(current);

        } catch (err) {
            logger.error(err);
            logger.error('cannot initialize pouchdb for sync');
            return;
        }
        try {
            const all = await this.db.allDocs({include_docs: true});
            for (const entity of all.rows) {
                logger.debug(entity.doc);
                this.updateObserver.notifyObservers(entity.doc, 1);
            }
        } catch (err) {
            logger.error(err);
        }

    }

    private getPath(): string {
        const path = window.location.pathname.split('/');
        if (path.length == 3 && path[1]) {
            return path[2];
        } else {
            return null;
        }
    }


    async changeColor(oldColor: Color3, newColor: Color3) {
        const all = await this.db.allDocs({include_docs: true});
        for (const entity of all.rows) {
            logger.debug(`comparing ${entity.doc.color} to ${oldColor.toHexString()}`);
            if (entity.doc.color == oldColor.toHexString()) {
                entity.doc.color = newColor.toHexString();
                this.db.put({...entity.doc, _rev: entity.doc._rev});
            }
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
                    this.removeObserver.notifyObservers({id: doc._id, template: doc.template}, 1);
                } else {
                    this.updateObserver.notifyObservers(doc, 1);
                }

            }
        }

    }

    private async beginSync(localName: string) {
        try {
            //const remoteDbName = "db1";

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

function hex_to_ascii(input) {
    var hex = input.toString();
    let output = '';
    for (let n = 0; n < hex.length; n += 2) {
        output += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return output;
}

function ascii_to_hex(str) {
    const arr1 = [];
    for (let n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
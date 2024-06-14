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
import {UserModelType} from "../users/userTypes";
import {getMe} from "../util/me";
import {Encryption} from "./encryption";
import {Presence} from "./presence";

type PasswordEvent = {
    detail: string;

}
export class PouchdbPersistenceManager {
    private _logger: Logger = log.getLogger('PouchdbPersistenceManager');
    onDBEntityUpdateObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    onDBEntityRemoveObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    private db: PouchDB;
    private remote: PouchDB;
    private user: string;
    private _encryption = new Encryption();
    private _encKey = null;
    private _diagramManager: DiagramManager;

    constructor() {
        document.addEventListener('passwordset', (evt) => {
            this._encKey = ((evt as unknown) as PasswordEvent).detail || null;
            if (this._encKey && typeof (this._encKey) == 'string') {
                this.initialize().then(() => {
                    this._logger.debug('Initialized');
                });
            }
            console.log(evt);
        });
    }

    public setDiagramManager(diagramManager: DiagramManager) {
        this._diagramManager = diagramManager;
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

        this.onDBEntityUpdateObservable.add((evt) => {
            this._logger.debug(evt);
            if (evt.id != 'metadata' && evt.type != 'user') {
                diagramManager.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: evt
                }, DiagramEventObserverMask.FROM_DB);
            } else {

            }

        });


        this.onDBEntityRemoveObservable.add((entity) => {
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
        if (this._encKey && !this._encryption.ready) {
            await this._encryption.setPassword(this._encKey);
        }
        try {
            const doc = await this.db.get(entity.id, {conflicts: true, include_docs: true});
            if (doc && doc._conflicts) {
                this._logger.warn('CONFLICTS!', doc._conflicts);
            }
            if (this._encKey) {
                await this._encryption.encryptObject(entity);
                const newDoc = {
                    _id: doc._id,
                    _rev: doc._rev,
                    encrypted: this._encryption.getEncrypted()
                }
                this.db.put(newDoc)
            } else {
                if (doc) {
                    const newDoc = {_id: doc._id, _rev: doc._rev, ...entity};
                    this.db.put(newDoc);
                } else {
                    this.db.put({_id: entity.id, ...entity});
                }
            }

        } catch (err) {
            if (err.status == 404) {
                try {
                    if (this._encKey) {
                        await this._encryption.encryptObject(entity);
                        const newDoc = {
                            _id: entity.id,
                            encrypted: this._encryption.getEncrypted()
                        }
                        this.db.put(newDoc);
                    } else {
                        const newEntity = {_id: entity.id, ...entity};
                        this.db.put(newEntity);
                    }
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

    private async setupMetadata(current: string): Promise<boolean> {
        try {
            const doc = await this.db.get('metadata');
            if (doc.encrypted) {
                if (!this._encKey) {
                    const promptPassword = new CustomEvent('promptpassword', {detail: 'Please enter password'});
                    document.dispatchEvent(promptPassword);
                    return false;
                }
                if (!this._encryption.ready) {
                    await this._encryption.setPassword(this._encKey, doc.encrypted.salt);
                }
                const decrypted = await this._encryption.decryptToObject(doc.encrypted.encrypted, doc.encrypted.iv);
                if (decrypted.friendly) {
                    localStorage.setItem(current, decrypted.friendly);
                }
            } else {
                if (doc && doc.friendly) {
                    localStorage.setItem(current, doc.friendly);
                }
                if (doc && doc.camera) {

                }
            }
        } catch (err) {
            if (err.status == 404) {
                this._logger.debug('no metadata found');
                const friendly = localStorage.getItem(current);
                if (friendly) {
                    if (this._encKey) {
                        if (!this._encryption.ready) {
                            await this._encryption.setPassword(this._encKey);
                        }
                        await this._encryption.encryptObject({friendly: friendly});
                        await this.db.put({_id: 'metadata', id: 'metadata', encrypted: this._encryption.getEncrypted()})
                    } else {
                        this._logger.debug('local friendly name found ', friendly, ' setting metadata');
                        const newDoc = {_id: 'metadata', id: 'metadata', friendly: friendly};
                        await this.db.put(newDoc);
                    }
                } else {
                    this._logger.debug('no friendly name found');
                }
            }
        }
        return true;
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
            //await this.db.compact();
            if (sync) {
                if (await this.setupMetadata(current)) {
                    await this.beginSync(current);
                }
            }
            return true;
        } catch (err) {
            this._logger.error(err);
            this._logger.error('cannot initialize pouchdb for sync');
            return false;
        }
    }

    private async sendLocalDataToScene() {

        let salt = null;

        const clear = localStorage.getItem('clearLocal');
        try {

            const all = await this.db.allDocs({include_docs: true});
            for (const dbEntity of all.rows) {
                this._logger.debug(dbEntity.doc);
                if (clear) {
                    this.remove(dbEntity.id);
                } else {
                    if (dbEntity.doc.encrypted) {
                        if (!salt || salt != dbEntity.doc.encrypted.salt) {
                            await this._encryption.setPassword(this._encKey, dbEntity.doc.encrypted.salt);
                            salt = dbEntity.doc.encrypted.salt;
                        }
                        const decrypted = await this._encryption.decryptToObject(dbEntity.doc.encrypted.encrypted, dbEntity.doc.encrypted.iv);

                        if (decrypted.id != 'metadata') {
                            this.onDBEntityUpdateObservable.notifyObservers(decrypted, DiagramEventObserverMask.FROM_DB);
                        }

                    } else {

                        if (dbEntity.id != 'metadata') {
                            this.onDBEntityUpdateObservable.notifyObservers(dbEntity.doc, DiagramEventObserverMask.FROM_DB);
                        }


                    }
                }
                if (clear) {
                    localStorage.removeItem('clearLocal');
                }
            }
        } catch (err) {
            switch (err.message) {
                case 'WebCrypto_DecryptionFailure: ':
                case 'Invalid data type!':
                    const promptPassword = new CustomEvent('promptpassword', {detail: 'Please enter password'});
                    document.dispatchEvent(promptPassword);
            }
            this._logger.error(err);
        }
    }

    private async beginSync(localName: string) {
        try {
            const userHex = ascii_to_hex(localName);
            const remoteDbName = 'userdb-' + userHex;
            const remoteUserName = localName;
            const password = this._encKey || localName;

            if (await checkDb(localName, remoteDbName, password) == false) {
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
                    try {
                        const buildTarget = await axios.post(userEndpoint,
                            {username: remoteUserName, password: password});
                        if (buildTarget.status != 200) {
                            this._logger.error(buildTarget.statusText);
                            return;
                        } else {
                            this.user = buildTarget.data.userCtx;
                            this._logger.debug(this.user);
                        }
                    } catch (err) {
                        if (err.response && err.response.status == 401) {
                            this._logger.warn(err);
                            const promptPassword = new CustomEvent('promptpassword', {detail: 'Please enter password'});
                            document.dispatchEvent(promptPassword);
                        }

                        //                    } else {
                        this._logger.error(err);
                    }

                }
            }

            const remoteEndpoint: string = import.meta.env.VITE_SYNCDB_ENDPOINT;
            this._logger.debug(remoteEndpoint + remoteDbName);
            this.remote = new PouchDB(remoteEndpoint + remoteDbName,
                {auth: {username: remoteUserName, password: password}, skip_setup: true});
            const dbInfo = await this.remote.info();
            this._logger.debug(dbInfo);
            const presence: Presence = new Presence(getMe(), remoteDbName);
            this._diagramManager.onUserEventObservable.add((user: UserModelType) => {
                this._logger.debug(user);
                presence.sendUser(user);
            }, -1, false, this);
            this.db.sync(this.remote, {live: true, retry: true})
                .on('change', (info) => {
                    syncDoc(info, this.onDBEntityRemoveObservable, this.onDBEntityUpdateObservable, this._encryption, this._encKey);
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


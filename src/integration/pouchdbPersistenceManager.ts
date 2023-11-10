import PouchDB from 'pouchdb';
import {DiagramEntity, DiagramEventType} from "../diagram/types/diagramEntity";
import {Color3, Observable} from "@babylonjs/core";
import {AppConfigType} from "../util/appConfigType";
import {v4 as uuidv4} from 'uuid';
import axios from "axios";
import {DiagramManager} from "../diagram/diagramManager";
import log, {Logger} from "loglevel";
import {DiagramListing, DiagramListingEventType} from "../diagram/types/diagramListing";


export class PouchdbPersistenceManager {
    configObserver: Observable<AppConfigType> = new Observable<AppConfigType>();
    updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    removeObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    //implement IPersistenceManager interface with pouchdb apis
    private db: PouchDB;
    private remote: PouchDB;
    private config: PouchDB;
    private diagramListings: PouchDB;
    private readonly logger: Logger = log.getLogger('PouchdbPersistenceManager');
    constructor() {
        this.config = new PouchDB("config");
        this.diagramListings = new PouchDB("diagramListings");
    }

    public setDiagramManager(diagramManager: DiagramManager) {
        diagramManager.onDiagramEventListingObservable.add((evt) => {
            if (evt.type == DiagramListingEventType.GETALL) {
                this.diagramListings.allDocs({include_docs: true}).then((all) => {
                    for (const entity of all.rows) {
                        diagramManager.onDiagramEventListingObservable.notifyObservers({
                            type: DiagramListingEventType.ADD,
                            listing: {id: entity.doc._id, name: entity.doc.name}
                        }, -1, false, this);
                    }
                });
            }
        }, -1, false, this);
        diagramManager.onDiagramEventObservable.add((evt) => {
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
                //this.logger.warn('App', 'unknown diagram event type', evt);
            }
        }, 2);
        this.updateObserver.add((evt) => {
            diagramManager.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: evt
            }, 1);
        });
        this.removeObserver.add((entity) => {
            diagramManager.onDiagramEventObservable.notifyObservers(
                {type: DiagramEventType.REMOVE, entity: entity}, 1);
        });
    }

    private _currentDiagramId: string;

    public get currentDiagramId(): string {
        return this._currentDiagramId;
    }

    public set currentDiagramId(value: string) {
        this._currentDiagramId = value;
        try {
            const listing = this.diagramListings.get(value);
        } catch (err) {
            this.diagramListings.put({_id: value, name: "New Diagram"});
        }
        this.db = new PouchDB(value);
        this.db.sync(this.remote, {live: true});
    }

    public async add(entity: DiagramEntity) {
        if (!entity) {
            return;
        }
        const newEntity = {...entity, _id: entity.id};
        try {
            this.db.put(newEntity);
        } catch (err) {
            this.logger.error(err);
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
            this.logger.error(err);
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
            this.logger.error(err);
        }
    }

    public async addDiagram(diagram: DiagramListing) {
        try {
            const doc = await this.diagramListings.get(diagram.id);

        } catch (err) {
            this.diagramListings.put({...diagram, _id: diagram.id});
        }
    }

    public async removeDiagram(diagram: DiagramListing) {
        try {
            this.diagramListings.delete(diagram.id);
        } catch (err) {
            this.logger.error(err);
        }
    }

    public async modifyDiagram(diagram: DiagramListing) {
        try {
            const doc = await this.db.get(diagram.id);
            this.db.put({...doc, ...diagram});
        } catch (err) {
            this.logger.error(err);
        }

    }

    public async getNewRelicData(): Promise<any[]> {
        return [];
    }

    public async setNewRelicData(data: any[]): Promise<any> {
        return data;
    }

    public async setConfig(config: any, initial: boolean = false): Promise<any> {
        if (!initial) {
            const doc = await this.config.get('1');
            const newConf = {...config, _id: '1', _rev: doc._rev};
            return this.config.put(newConf);
        } else {
            const newConf = {...config, _id: '1'};
            return this.config.put(newConf);
        }
    }

    public async getConfig(): Promise<any> {
        return this.config.get('1');
    }

    public async initialize() {
        try {
            const config = await this.config.get('1');
            if (config.currentDiagramId) {
                this.db = new PouchDB(config.currentDiagramId);
                await this.beginSync(config.currentDiagramId);
            } else {
                config.currentDiagramId = uuidv4();
                this.db = new PouchDB(config.currentDiagramId);
                await this.beginSync(config.currentDiagramId);
                await this.config.put(config);
            }
            this.configObserver.notifyObservers(config);
        } catch (err) {
            const defaultConfig = {
                _id: '1',
                demoCompleted: false,
                gridSnap: 1,
                rotateSnap: 0,
                createSnap: 0,
                turnSnap: 0,
                flyMode: true,
                currentDiagramId: uuidv4()
            }
            try {
                await this.setConfig(defaultConfig, true);
            } catch (err) {
                this.logger.error(err);
            }

            this.diagramListings.put({_id: defaultConfig.currentDiagramId, name: "New Diagram"});
            this.db = new PouchDB(defaultConfig.currentDiagramId);
            await this.beginSync(defaultConfig.currentDiagramId);
            this.configObserver.notifyObservers(defaultConfig);
        }
        try {
            const all = await this.db.allDocs({include_docs: true});
            for (const entity of all.rows) {
                this.updateObserver.notifyObservers(entity.doc, 1);
            }
        } catch (err) {
            this.logger.error(err);
        }

    }
    syncDoc = function (info) {
        this.logger.info(info);
        if (info.direction == 'pull') {
            const docs = info.change.docs;
            for (const doc of docs) {
                if (doc._deleted) {
                    this.removeObserver.notifyObservers({id: doc._id, template: doc.template}, 1);

                } else {
                    this.updateObserver.notifyObservers(doc, 1);
                }

            }
        }

    }

    async changeColor(oldColor: Color3, newColor: Color3) {
        const all = await this.db.allDocs({include_docs: true});
        for (const entity of all.rows) {
            this.logger.debug(`comparing ${entity.doc.color} to ${oldColor.toHexString()}`);
            if (entity.doc.color == oldColor.toHexString()) {
                entity.doc.color = newColor.toHexString();
                this.db.put({...entity.doc, _rev: entity.doc._rev});
            }
        }
    }

    setCurrentDiagram(diagram: DiagramListing) {
        this.currentDiagramId = diagram.id;
    }

    sync() {

    }

    private async beginSync(remoteDbName: string) {
        try {

            //const remoteDbName = "db1";
            const remoteUserName = "user1";
            const password = "password";
            const dbs = await axios.get(import.meta.env.VITE_SYNCDB_ENDPOINT + '_all_dbs');
            if (dbs.data.indexOf(remoteDbName) == -1) {
                this.logger.warn('sync target missing');
                const buildTarget = await axios.post(import.meta.env.VITE_USER_ENDPOINT,
                    {username: remoteUserName, password: password, db: remoteDbName});
                if (buildTarget.status != 200) {
                    this.logger.info(buildTarget.statusText);
                    return;
                }
            }
            this.logger.debug(dbs);

            this.remote = new PouchDB(import.meta.env.VITE_SYNCDB_ENDPOINT + remoteDbName,
                {auth: {username: remoteUserName, password: password}});

            this.syncDoc = this.syncDoc.bind(this);
            this.db.sync(this.remote, {live: true, retry: true})
                .on('change', this.syncDoc);
        } catch (err) {
            this.logger.error(err);
        }
    }
}
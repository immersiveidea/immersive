import {DiagramListing, DiagramListingEvent, DiagramListingEventType, IPersistenceManager} from "./iPersistenceManager";
import {Observable} from "@babylonjs/core";
import {DiagramEntity} from "../diagram/diagramEntity";
import Dexie from "dexie";
import log from "loglevel";
import {AppConfigType} from "../util/appConfigType";


export class IndexdbPersistenceManager implements IPersistenceManager {
    private readonly logger = log.getLogger('IndexdbPersistenceManager');
    public readonly diagramListingObserver: Observable<DiagramListingEvent> = new Observable<DiagramListingEvent>();
    public readonly updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    public readonly configObserver: Observable<AppConfigType> = new Observable<AppConfigType>();
    private db: Dexie;

    private currentDiagramId: string;

    constructor(name: string) {
        this.db = new Dexie(name);
        const version = 7;


        this.db.version(version).stores({config: "id,gridSnap,rotateSnap,createSnap"});
        this.db.version(version).stores({entities: "id,diagramlistingid,position,rotation,last_seen,template,text,scale,color"});
        this.db.version(version).stores({diagramlisting: "id,name,description,sharekey"});
        this.db.version(version).stores({newRelicData: "id,priority, incidentId"});
        this.logger.debug("IndexdbPersistenceManager constructed");
    }

    public setCurrentDiagram(diagram: DiagramListing) {
        this.currentDiagramId = diagram.id;
    }

    public add(entity: DiagramEntity) {
        if (!entity) {
            this.logger.error("Adding null mesh, early return");
            return;
        }
        entity.diagramlistingid = this.currentDiagramId;
        this.db["entities"].add(entity);
        this.logger.debug('add', entity);
    }

    public addDiagram(diagram: DiagramListing) {
        this.db["diagramlisting"].add(diagram);
        const event = {
            type: DiagramListingEventType.ADD,
            listing: diagram
        }
        this.diagramListingObserver.notifyObservers(event);
    }

    public remove(id: string) {
        if (!id) {
            this.logger.error("Removing null mesh, early return");
            return;
        }
        this.db["entities"].delete(id);
    }

    public setConfig(config: AppConfigType) {
        config.id = 1;
        this.db["config"].put(config);
        this.logger.debug('setConfig', config);
        this.configObserver.notifyObservers(config);
    }

    public removeDiagram(diagram: DiagramListing) {
        this.db["diagramlisting"].delete(diagram.id);
        const event = {
            type: DiagramListingEventType.REMOVE,
            listing: diagram
        }
        this.diagramListingObserver.notifyObservers(event);
    }

    modifyDiagram(diagram: DiagramListing) {
        this.db["diagramlisting"].update(diagram.id, diagram);
        const event = {
            type: DiagramListingEventType.MODIFY,
            listing: diagram
        }
        this.diagramListingObserver.notifyObservers(event);
    }

    public async setNewRelicData(data: any[]) {
        this.db["newRelicData"].clear();
        data.forEach((d) => {
            this.db["newRelicData"].add(d);
        });
    }

    public async getNewRelicData(): Promise<any[]> {
        return this.db["newRelicData"].toArray();
    }

    public async getConfig(): Promise<AppConfigType> {
        const configs = await this.db['config'].toArray();
        return configs[0];
    }

    public async initialize() {
        this.logger.info('initialize', this.db['entities'].length);
        const configs = await this.db['config'].toArray();
        const config = configs[0];
        if (config) {
            this.logger.debug('initialize config', config);
            this.configObserver.notifyObservers(config);

            if (config.currentDiagramId) {
                this.logger.debug('initialize currentDiagramId', config.currentDiagramId);
                const currentDiagram = await this.db['diagramlisting'].get(config.currentDiagramId);
                if (currentDiagram) {
                    this.logger.debug('found currentDiagram', currentDiagram);
                    this.currentDiagramId = currentDiagram.id;
                } else {
                    this.logger.error('could not find currentDiagram', config.currentDiagramId);
                }
            } else {
                this.logger.warn('no currentDiagramId, using default');
            }
        } else {

            this.configObserver.notifyObservers(
                {
                    id: 1,
                    demoCompleted: false,
                    gridSnap: 1,
                    rotateSnap: 0,
                    createSnap: 0,
                    turnSnap: 0,
                    currentDiagramId: null
                }
            );
        }
        this.getFilteredEntities().each((e) => {
            this.logger.debug('adding', e);
            this.updateObserver.notifyObservers(e);
        });
        this.listDiagrams();
        this.logger.info("initialize finished");
    }

    public sync() {
        this.getFilteredEntities().each((e) => {
            this.logger.debug('adding', e);
            this.updateObserver.notifyObservers(e);
        });
    }

    public modify(entity: DiagramEntity) {
        if (!entity) {
            this.logger.error("Modifying null mesh, early return");
            return;
        }
        this.db["entities"].update(entity.id, entity);
        this.logger.debug('modify', entity);
    }

    public changeColor(oldColor, newColor) {
        if (!oldColor) {
            if (!newColor) {
                this.logger.error("changeColor called with no new color, early return");
            } else {
                this.logger.info("changeColor called with no old Color, new color added to diagram, early return");
            }
            return;
        }
        this.logger.debug(`changeColor ${oldColor.toHexString()} to ${newColor.toHexString()}`);
        this.getFilteredEntities().filter((e) => e.color == oldColor.toHexString()).modify({color: newColor.toHexString()});
    }

    private listDiagrams() {
        return this.db["diagramlisting"].toArray((diagrams) => {
            this.logger.debug('listDiagrams', diagrams);
            for (const diagram of diagrams) {
                const event = {
                    type: DiagramListingEventType.GET,
                    listing: diagram
                }
                this.diagramListingObserver.notifyObservers(event);
            }
        });
    }

    private getFilteredEntities() {
        return this.db['entities'].filter((e) => {
                if (!this.currentDiagramId && !e.diagramlistingid) {
                    return true;
                } else {
                    return e.diagramlistingid == this.currentDiagramId;
                }
            }
        );
    }
}
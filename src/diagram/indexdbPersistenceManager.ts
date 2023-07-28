import {IPersistenceManager} from "./persistenceManager";
import {AbstractMesh, Observable, Vector3} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";
import Dexie from "dexie";
import {MeshConverter} from "./meshConverter";
import log from "loglevel";
import {AppConfigType} from "../util/appConfig";


export class IndexdbPersistenceManager implements IPersistenceManager {
    private readonly logger = log.getLogger('IndexdbPersistenceManager');
    public readonly updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    public readonly configObserver: Observable<AppConfigType> = new Observable<AppConfigType>();
    private db: Dexie;

    constructor(name: string) {
        this.db = new Dexie(name);
        const version = 2;
        this.db.version(2).stores({config: "id,gridSnap,rotateSnap,createSnap"});
        this.db.version(2).stores({entities: "id,position,rotation,last_seen,template,text,scale,color"});
        this.logger.debug("IndexdbPersistenceManager constructed");

    }

    public add(mesh: AbstractMesh) {
        if (!mesh) {
            this.logger.error("Adding null mesh, early return");
            return;
        }
        const entity = <any>MeshConverter.toDiagramEntity(mesh);
        entity.position = this.vectoxys(mesh.position);
        entity.rotation = this.vectoxys(mesh.rotation);
        entity.scale = this.vectoxys(mesh.scaling);
        this.db["entities"].add(entity);
        this.logger.debug('add', mesh, entity);
    }

    public remove(mesh: AbstractMesh) {
        if (!mesh) {
            this.logger.error("Removing null mesh, early return");
            return;
        }
        this.db["entities"].delete(mesh.id);
    }

    public setConfig(config: AppConfigType) {
        config.id = 1;
        this.db["config"].put(config);
        this.logger.debug('setConfig', config);
        this.configObserver.notifyObservers(config);
    }

    public modify(mesh) {
        if (!mesh) {
            this.logger.error("Modifying null mesh, early return");
            return;
        }
        const entity = <any>MeshConverter.toDiagramEntity(mesh);
        if (!entity) {
            this.logger.error("Modifying null mesh, early return");
            return;
        }
        entity.position = this.vectoxys(mesh.position);
        entity.rotation = this.vectoxys(mesh.rotation);
        entity.scale = this.vectoxys(mesh.scaling);
        this.db["entities"].update(mesh.id, entity);
        this.logger.debug('modify', mesh, entity);
    }

    public initialize() {
        this.logger.info('initialize', this.db['entities'].length);
        this.db['entities'].each((e) => {
            e.position = this.xyztovec(e.position);
            e.rotation = this.xyztovec(e.rotation);
            e.scale = this.xyztovec(e.scale);
            this.logger.debug('adding', e);
            this.updateObserver.notifyObservers(e);
        });
        this.db['config'].each((c) => {
            this.configObserver.notifyObservers(c);
        });
        this.logger.info("initialize finished");
    }

    public changeColor(oldColor, newColor) {
        if (!oldColor || !newColor) {
            this.logger.error("changeColor called with null color, early return");
            return;
        }
        this.logger.debug(`changeColor ${oldColor.toHexString()} to ${newColor.toHexString()}`);
        this.db['entities'].where('color').equals(oldColor.toHexString()).modify({color: newColor.toHexString()});
    }

    private vectoxys(v: Vector3): { x, y, z } {
        return {x: v.x, y: v.y, z: v.z};
    }

    private xyztovec(xyz: { x, y, z }): Vector3 {
        return new Vector3(xyz.x, xyz.y, xyz.z);
    }
}
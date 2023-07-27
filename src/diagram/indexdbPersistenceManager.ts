import {IPersistenceManager} from "./persistenceManager";
import {AbstractMesh, Observable, Vector3} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";
import Dexie from "dexie";
import {MeshConverter} from "./meshConverter";
import log from "loglevel";

export class IndexdbPersistenceManager implements  IPersistenceManager {
    public updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    private db: Dexie;
    constructor(name: string) {
        this.db = new Dexie(name);
        this.db.version(1).stores({entities: "id,position,rotation,last_seen,template,text,scale,color"});
        log.debug('IndexdbPersistenceManager', "IndexdbPersistenceManager constructed");
    }
    public  add(mesh: AbstractMesh) {
        if (!mesh) {
            log.warn('IndexdbPersistenceManager', "Adding null mesh");
            return;
        }
        const entity = <any>MeshConverter.toDiagramEntity(mesh);
        entity.position = this.vectoxys(mesh.position);
        entity.rotation = this.vectoxys(mesh.rotation);
        entity.scale = this.vectoxys(mesh.scaling);

        this.db["entities"].add(entity);
    }
    private vectoxys(v: Vector3): {x, y ,z} {
        return {x: v.x, y: v.y, z: v.z};
    }
    private xyztovec(xyz: {x, y, z}): Vector3 {
        return new Vector3(xyz.x, xyz.y, xyz.z);
    }

    public  remove(mesh: AbstractMesh)  {
        this.db["entities"].delete(mesh.id);
    }
    public  modify(mesh) {
        const entity = <any>MeshConverter.toDiagramEntity(mesh);
        entity.position = this.vectoxys(mesh.position);
        entity.rotation = this.vectoxys(mesh.rotation);
        entity.scale = this.vectoxys(mesh.scaling);
        this.db["entities"].update(mesh.id, entity);
    }
    public initialize() {
        this.db['entities'].each((e) => {
            e.position = this.xyztovec(e.position);
            e.rotation = this.xyztovec(e.rotation);
            e.scale = this.xyztovec(e.scale);
            log.debug('IndexdbPersistenceManager', 'adding', e);
            this.updateObserver.notifyObservers(e);
        });
        log.warn('IndexdbPersistenceManager', "initialize finished");
    }
    public changeColor(oldColor, newColor) {
        log.debug('IndexdbPersistenceManager', `changeColor ${oldColor.toHexString()} to ${newColor.toHexString()}`);
        this.db['entities'].where('color').equals(oldColor.toHexString()).modify({color: newColor.toHexString()});
    }
}
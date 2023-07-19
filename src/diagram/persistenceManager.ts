import {AbstractMesh, Observable, StandardMaterial, Vector3} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";
import Dexie from "dexie";

export class PersistenceManager {
    public updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    private db: Dexie = new Dexie("diagram");
    constructor() {
        this.db.version(1).stores({entities: "id,position,rotation,last_seen,template,text,scale,color"});
    }
    public  add(mesh: AbstractMesh) {
        const entity = <any>{};
        entity.id = mesh.id;
        entity.position = this.vectoxys(mesh.position);
        entity.rotation = this.vectoxys(mesh.rotation);
        entity.last_seen = new Date().getDate();
        entity.template = mesh?.metadata?.template;
        entity.text = mesh?.metadata?.text;
        entity.scale = this.vectoxys(mesh.scaling);
        if (mesh.material) {
            entity.color = (mesh.material as StandardMaterial).diffuseColor.toHexString();
        }
        this.db["entities"].add(entity);
    }
    private vectoxys(v: Vector3): {x, y ,z} {
        return {x: v.x, y: v.y, z: v.z};
    }
    private xyztovec(xyz: {x, y, z}): Vector3 {
        return new Vector3(xyz.x, xyz.y, xyz.z);
    }

    public  remove() {

    }
    public  modify() {

    }
    public initialize() {
        this.db['entities'].each((e: DiagramEntity) => {
            e.position = this.xyztovec(e.position);
            e.rotation = this.xyztovec(e.rotation);
            e.scale = this.xyztovec(e.scale);
            console.log(e);
            this.updateObserver.notifyObservers(e);
        });
    }

    private dummyEntity(): DiagramEntity {
        const entity: DiagramEntity = <DiagramEntity>{};
        entity.id = "test";
        entity.position = new Vector3(0,2,-5);
        entity.rotation = Vector3.Zero();
        entity.last_seen = new Date();
        entity.scale = new Vector3(.1,.1,.1);
        entity.color = "#ff0000";
        entity.text = "test";
        entity.parent = null;
        entity.template = "#text-template";
        return entity;
    }
}
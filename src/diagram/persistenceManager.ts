import {AbstractMesh, Mesh, Observable, StandardMaterial, Vector3} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";

export class PersistenceManager {
    public updateObserver: Observable<DiagramEntity> = new Observable<DiagramEntity>();

    constructor() {

    }
    public  add(mesh: AbstractMesh) {
        const entity = <any>{};
        entity.id = mesh.id;
        entity.position = mesh.position.toString();
        entity.rotation = mesh.rotation.toString();
        entity.last_seen = new Date().getDate();
        entity.template = "default";
        entity.text = "";
        entity.scale = mesh.scaling.toString();
        if (mesh.material) {
            entity.color = (mesh.material as StandardMaterial).diffuseColor.toHexString();
        }

        console.log(entity);
    }

    public  remove() {

    }
    public  modify() {

    }
    public initialize() {
        const entity: DiagramEntity = <DiagramEntity>{};
        entity.id = "test";
        entity.position = new Vector3(0,2,-2);
        entity.rotation = Vector3.Zero();
        entity.last_seen = new Date();
        entity.scale = Vector3.One();
        entity.color = "#ff0000";
        entity.text = "test";
        entity.parent = null;
        entity.template = "#box-template";

        this.updateObserver.notifyObservers(entity);
    }


}
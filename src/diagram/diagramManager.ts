import {AbstractMesh, Color3, Mesh, MeshBuilder, Observable, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import {BmenuState} from "../menus/bmenu";


export enum DiagramEventType {
    ADD,
    REMOVE,
    MODIFY,
    DROP,
    DROPPED,


}

export type DiagramEvent = {
    type: DiagramEventType;
    menustate?: BmenuState;
    entity?: DiagramEntity;

}

export type DiagramEntity = {
    color?: string;
    id?: string;
    last_seen?: Date;
    position?: Vector3;
    rotation?: Vector3;
    template?: string;
    text?: string;
    scale?: Vector3;
    parent?: string;
}

export class DiagramManager {
    static onDiagramEventObservable = new Observable();
    static leftController: Mesh;
    static currentMesh: AbstractMesh;
    static rightController: Mesh;
    static state: BmenuState;
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        if (DiagramManager.onDiagramEventObservable.hasObservers()) {

        } else {
            DiagramManager.onDiagramEventObservable.add(this.#onDiagramEvent, -1, true, this);
        }
    }

    #onDiagramEvent(event: DiagramEvent) {
        console.log(event);
        const entity = event.entity;

        let mesh;

        let material
        if (entity) {
            mesh = this.scene.getMeshByName(entity.id);
            material = this.scene.getMaterialByName("material-" + entity.id);
            if (!material) {
                material = new StandardMaterial("material-" + event.entity.id, this.scene);
                material.ambientColor = Color3.FromHexString(event.entity.color.replace("#", ""));
            }
        }


        switch (event.type) {
            case DiagramEventType.DROPPED:
                break;
            case DiagramEventType.DROP:
                if (DiagramManager.currentMesh) {
                    const newMesh = DiagramManager.currentMesh.clone(DiagramManager.currentMesh.name = "id" + uuidv4(), DiagramManager.currentMesh.parent);
                    DiagramManager.currentMesh.setParent(null);
                    DiagramManager.currentMesh = newMesh;
                    DiagramManager.onDiagramEventObservable.notifyObservers({
                        type: DiagramEventType.DROPPED,
                        entity: entity
                    });
                }
                break;
            case DiagramEventType.ADD:
                if (DiagramManager.currentMesh){
                    DiagramManager.currentMesh.dispose();
                }

                if (mesh) {
                    return;
                } else {
                    mesh = this.#createMesh(entity);
                    if (!mesh) {
                        return;
                    }

                }

            case DiagramEventType.MODIFY:
                if (!mesh) {

                } else {
                    const rotation = entity.rotation;
                    const scale = entity.scale;
                    const position = entity.position;

                    mesh.material = material;
                    mesh.position = new Vector3(position.x, position.y, position.z);
                    mesh.rotation = new Vector3(rotation.x, rotation.y, rotation.z);

                    if (entity.parent) {
                        mesh.parent = this.scene.getMeshByName(entity.parent);
                    }
                }
                DiagramManager.currentMesh = mesh;
                break;
            case DiagramEventType.REMOVE:
                break;


        }

    }

    #createMesh(entity: DiagramEntity) {
        if (!entity.id) {
            entity.id = "id" + uuidv4();
        }
        let mesh: Mesh;
        switch (entity.template) {
            case "#box-template":
                mesh = MeshBuilder.CreateBox(entity.id,
                    {
                        width: entity.scale.x,
                        height: entity.scale.y,
                        depth: entity.scale.z
                    }, this.scene);
                break;

            case "#sphere-template":

                mesh = MeshBuilder.CreateSphere(entity.id, {diameter: entity.scale.x}, this.scene);
                break
            case "#cylinder-template":
                mesh = MeshBuilder.CreateCylinder(entity.id, {
                    diameter: entity.scale.x,
                    height: entity.scale.y
                }, this.scene);
                break;
            default:
                mesh = null;
        }
        return mesh;
    }

}



import {
    AbstractMesh,
    Angle,
    Color3,
    Mesh,
    MeshBuilder,
    Observable, Scene,
    StandardMaterial,
    Vector3, WebXRExperienceHelper
} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {PersistenceManager} from "./persistenceManager";

export class DiagramManager {
    private persistenceManager: PersistenceManager = new PersistenceManager();
    static onDiagramEventObservable = new Observable();
    private scene: Scene;
    private xr: WebXRExperienceHelper;
    static currentMesh: AbstractMesh;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;
        this.persistenceManager.updateObserver.add(this.#onRemoteEvent, -1, true, this);
        this.persistenceManager.initialize();
        if (!DiagramManager.onDiagramEventObservable) {
            DiagramManager.onDiagramEventObservable = new Observable();
        }
        if (DiagramManager.onDiagramEventObservable.hasObservers()) {

        } else {
            DiagramManager.onDiagramEventObservable.add(this.#onDiagramEvent, -1, true, this);
        }
    }
    #onRemoteEvent(event: DiagramEntity) {
        const mesh = this.#createMesh(event);
        const material = new StandardMaterial("material-" + event.id, this.scene);
        material.diffuseColor = Color3.FromHexString(event.color);
        mesh.material = material;
    }

    #onDiagramEvent(event: DiagramEvent) {
        const entity = event.entity;
        let mesh;
        let material
        if (entity) {
            mesh = this.scene.getMeshByName(entity.id);
            if (mesh) {
                material = mesh.material;
            }
        }

        switch (event.type) {
            case DiagramEventType.CLEAR:
                DiagramManager.currentMesh.dispose();
                DiagramManager.currentMesh = null;
                break;
            case DiagramEventType.DROPPED:
                break;
            case DiagramEventType.DROP:
                if (DiagramManager.currentMesh) {
                    this.persistenceManager.add(DiagramManager.currentMesh);
                    const newName = uuidv4();
                    const newMesh = DiagramManager.currentMesh.clone("id"+newName, DiagramManager.currentMesh.parent);
                    const newMaterial = DiagramManager.currentMesh.material.clone("material"+newName);
                    newMesh.material=newMaterial;
                    DiagramManager.currentMesh.setParent(null);
                    DiagramManager.currentMesh = newMesh;
                    DiagramManager.onDiagramEventObservable.notifyObservers({
                        type: DiagramEventType.DROPPED,
                        entity: entity
                    });
                }
                break;
            case DiagramEventType.ADD:
                if (DiagramManager.currentMesh) {
                    DiagramManager.currentMesh.dispose();
                }
                if (mesh) {
                    return;
                } else {
                    mesh = this.#createMesh(entity);
                    if (!material) {
                        material = new StandardMaterial("material-" + event.entity.id, this.scene);
                        material.diffuseColor = Color3.FromHexString(event.entity.color);
                        mesh.material = material;

                    }
                    if (!mesh) {
                        return;
                    }
                }
                DiagramManager.currentMesh = mesh;
                break;
            case DiagramEventType.MODIFY:
                if (!mesh) {

                } else {
                    if (!material) {
                        material = new StandardMaterial("material-" + event.entity.id, this.scene);
                        material.diffuseColor = Color3.FromHexString(event.entity.color);
                        if (mesh) {
                            mesh.material = material;
                        }

                    }
                    mesh.material = material;
                    mesh.position = entity.position;
                    mesh.rotation = entity.rotation;
                    if (entity.parent) {
                        mesh.parent = this.scene.getMeshByName(entity.parent);
                    } else {

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
                        width: 1,
                        height: 1,
                        depth: 1
                    }, this.scene);

                break;
            case "#sphere-template":
                mesh = MeshBuilder.CreateSphere(entity.id, {diameter: 1}, this.scene);
                break
            case "#cylinder-template":
                mesh = MeshBuilder.CreateCylinder(entity.id, {
                    diameter: 1,
                    height: 1
                }, this.scene);
                break;
            default:
                mesh = null;
        }
        if (mesh) {
            mesh.metadata = {template: entity.template};

            if (entity.position) {
                mesh.position = entity.position;
            }
            if (entity.rotation) {
                mesh.rotation = entity.rotation;
            }
            if (entity.parent) {
                mesh.parent = this.scene.getMeshByName(entity.parent);
            }
            if (entity.scale) {
                mesh.scaling = entity.scale;
            }
        }

        return mesh;
    }
}
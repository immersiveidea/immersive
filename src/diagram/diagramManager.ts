import {
    AbstractMesh,
    Color3,
    Observable,
    Scene,
    StandardMaterial,
    WebXRExperienceHelper
} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "./persistenceManager";
import {IndexdbPersistenceManager} from "./indexdbPersistenceManager";
import {MeshConverter} from "./meshConverter";

export class DiagramManager {
    private persistenceManager: IPersistenceManager = new IndexdbPersistenceManager("diagram");
    static onDiagramEventObservable = new Observable();
    private readonly scene: Scene;
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
        if (!mesh.material) {
            const material = new StandardMaterial("material-" + event.id, this.scene);
            material.diffuseColor = Color3.FromHexString(event.color);
            mesh.material = material;
        }

    }

    #onDiagramEvent(event: DiagramEvent) {
        const entity = event.entity;
        let mesh;
        if (entity) {
            mesh = this.scene.getMeshByName(entity.id);
        }

        switch (event.type) {
            case DiagramEventType.CLEAR:
                if (DiagramManager.currentMesh) {
                    DiagramManager.currentMesh.dispose();
                    DiagramManager.currentMesh = null;
                }
                break;
            case DiagramEventType.DROPPED:
                break;
            case DiagramEventType.DROP:
                if (DiagramManager.currentMesh) {
                    const newName = uuidv4();
                    const newMesh = DiagramManager.currentMesh.clone("id" + newName, DiagramManager.currentMesh.parent);
                    newMesh.id = "id" + newName;
                    newMesh.material = DiagramManager.currentMesh.material.clone("material" + newName);
                    DiagramManager.currentMesh.setParent(null);
                    this.persistenceManager.add(DiagramManager.currentMesh);
                    DiagramManager.onDiagramEventObservable.notifyObservers({
                        type: DiagramEventType.DROPPED,
                        entity: MeshConverter.toDiagramEntity(DiagramManager.currentMesh)
                    });
                    DiagramManager.currentMesh = newMesh;
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
                }
                DiagramManager.currentMesh = mesh;
                break;
            case DiagramEventType.MODIFY:
                if (!mesh) {

                } else {

                }
                DiagramManager.currentMesh = mesh;
                break;
            case DiagramEventType.REMOVE:
                break;
        }
    }
    #createMesh(entity: DiagramEntity) {
        return MeshConverter.fromDiagramEntity(entity, this.scene);
    }
}
import {
    AbstractMesh,
    InputBlock, Material, NodeMaterial,
    Observable,
    Scene,
    WebXRExperienceHelper
} from "@babylonjs/core";

import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "./persistenceManager";
import {IndexdbPersistenceManager} from "./indexdbPersistenceManager";
import {MeshConverter} from "./meshConverter";


export class DiagramManager {
    private persistenceManager: IPersistenceManager = new IndexdbPersistenceManager("diagram");
    static onDiagramEventObservable: Observable<DiagramEvent> = new Observable();

    private readonly scene: Scene;
    private xr: WebXRExperienceHelper;
    static currentMesh: AbstractMesh;

    private materialMap: Map<string, Material> = new Map<string, Material>();
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
        //const mesh = Toolbox.instance.newMesh(ToolType[Object.entries(ToolType).find(e => e[1] == event.template)[0]], event.id);
        const mesh = MeshConverter.fromDiagramEntity(event, this.scene);
        if (event.parent) {
            mesh.parent = this.scene.getMeshById(event.parent);
        }
    }
    private buildNodeMaterial() {
        const nodeMaterial = new NodeMaterial("nodeMaterial", this.scene, { emitComments: true });
        const positionInput = new InputBlock("position");
        positionInput.setAsAttribute("position");
    }
    #onDiagramEvent(event: DiagramEvent) {
        const entity = event.entity;
        let mesh;
        if (entity) {
            mesh = this.scene.getMeshById(entity.id);
        }
        switch (event.type) {
            case DiagramEventType.CLEAR:
                break;
            case DiagramEventType.DROPPED:
                break;
            case DiagramEventType.DROP:
                this.persistenceManager.add(mesh);
                break;
            case DiagramEventType.ADD:
                break;
            case DiagramEventType.MODIFY:
                this.persistenceManager.modify(mesh);
                break;
            case DiagramEventType.REMOVE:
                if (mesh) {
                    this.persistenceManager.remove(mesh);
                    mesh.dispose();
                }
                break;
        }
    }
}
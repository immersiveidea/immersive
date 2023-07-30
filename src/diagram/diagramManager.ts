import {
    AbstractMesh,
    ActionManager,
    Color3,
    ExecuteCodeAction,
    InstancedMesh,
    Mesh,
    Observable,
    PlaySoundAction,
    Scene,
    WebXRExperienceHelper
} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "./persistenceManager";
import {MeshConverter} from "./meshConverter";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";

export class DiagramManager {
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly logger = log.getLogger('DiagramManager');
    private persistenceManager: IPersistenceManager = null;
    private readonly scene: Scene;
    private xr: WebXRExperienceHelper;


    public setPersistenceManager(persistenceManager: IPersistenceManager) {
        this.persistenceManager = persistenceManager;
        this.persistenceManager.updateObserver.add(this.onRemoteEvent, -1, true, this);
    }

    private getPersistenceManager(): IPersistenceManager {
        if (!this.persistenceManager) {
            this.logger.warn("persistenceManager not set");
            return null;
        }
        return this.persistenceManager;
    }
    private readonly actionManager: ActionManager;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;
        this.actionManager = new ActionManager(this.scene);
        this.actionManager.registerAction(
            new PlaySoundAction(ActionManager.OnPointerOverTrigger, DiaSounds.instance.tick));
        this.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
                Controllers.controllerObserver.notifyObservers({
                    type: 'pulse',
                    gripId: evt?.additionalData?.pickResult?.gripTransform?.id
                })
                this.logger.debug(evt);
            })
        );
        if (this.onDiagramEventObservable.hasObservers()) {
            this.logger.warn("onDiagramEventObservable already has Observers, you should be careful");
        }
        this.onDiagramEventObservable.add(this.onDiagramEvent, -1, true, this);
        this.logger.debug("DiagramManager constructed");
    }

    public createCopy(mesh: AbstractMesh): AbstractMesh {
        let newMesh;
        if (!mesh.isAnInstance) {
            newMesh = new InstancedMesh("new", (mesh as Mesh));
        } else {
            newMesh = new InstancedMesh("new", (mesh as InstancedMesh).sourceMesh);
        }
        newMesh.actionManager = this.actionManager;
        return newMesh;

    }

    private onRemoteEvent(event: DiagramEntity) {
        this.logger.debug(event);
        const toolMesh = this.scene.getMeshById("tool-" + event.template + "-" + event.color);
        if (!toolMesh) {
            log.debug('no mesh found for ' + event.template + "-" + event.color, 'adding it');
            this.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.CHANGECOLOR,
                entity: event
            });
        }
        const mesh = MeshConverter.fromDiagramEntity(event, this.scene);
        mesh.actionManager = this.actionManager;
        if (event.parent) {
            mesh.parent = this.scene.getMeshById(event.parent);
        }
    }

    private onDiagramEvent(event: DiagramEvent) {
        this.logger.debug(event.type);
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
                this.getPersistenceManager()?.modify(mesh);
                MeshConverter.updateTextNode(mesh, entity.text);
                break;
            case DiagramEventType.ADD:
                this.getPersistenceManager()?.add(mesh);
                break;
            case DiagramEventType.MODIFY:
                this.getPersistenceManager()?.modify(mesh);
                break;
            case DiagramEventType.CHANGECOLOR:
                if (!event.oldColor) {
                    if (!event.newColor) {
                        this.getPersistenceManager()?.changeColor(null, Color3.FromHexString(event.entity.color));
                        this.logger.info("Recieved color change event, sending entity color as new color");
                    } else {
                        this.logger.info("Recieved color change event, no old color, sending new color");
                        this.getPersistenceManager()?.changeColor(null, event.newColor);
                    }
                } else {
                    if (event.newColor) {
                        this.logger.info("changing color from " + event.oldColor + " to " + event.newColor);
                        this.getPersistenceManager()?.changeColor(event.oldColor, event.newColor);
                    } else {
                        this.logger.error("changing color from " + event.oldColor + ", but no new color found");
                    }
                }

                break;
            case DiagramEventType.REMOVE:
                if (mesh) {
                    this.getPersistenceManager()?.remove(mesh)
                    mesh.dispose();
                }
                break;
        }
    }
}
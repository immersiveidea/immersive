import {Observable, Scene, WebXRExperienceHelper} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "./persistenceManager";
import {MeshConverter} from "./meshConverter";
import log from "loglevel";

export class DiagramManager {
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly logger = log.getLogger('DiagramManager');
    private persistenceManager: IPersistenceManager = null;
    private readonly scene: Scene;
    private xr: WebXRExperienceHelper;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;
        if (this.onDiagramEventObservable.hasObservers()) {
            this.logger.warn("onDiagramEventObservable already has Observers, you should be careful");
        }
        this.onDiagramEventObservable.add(this.onDiagramEvent, -1, true, this);
        this.logger.debug("DiagramManager constructed");
    }

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

    private onRemoteEvent(event: DiagramEntity) {
        //const mesh = Toolbox.instance.newMesh(ToolType[Object.entries(ToolType).find(e => e[1] == event.template)[0]], event.id);
        this.logger.debug(event);
        const mesh = MeshConverter.fromDiagramEntity(event, this.scene);
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
                this.getPersistenceManager()?.add(mesh)
                break;
            case DiagramEventType.ADD:
                break;
            case DiagramEventType.MODIFY:
                this.getPersistenceManager()?.modify(mesh)
                break;
            case DiagramEventType.CHANGECOLOR:
                this.getPersistenceManager()?.changeColor(event.oldColor, event.newColor);
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
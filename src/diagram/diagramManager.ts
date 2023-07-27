import {Observable, Scene, WebXRExperienceHelper} from "@babylonjs/core";

import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "./persistenceManager";
import {IndexdbPersistenceManager} from "./indexdbPersistenceManager";
import {MeshConverter} from "./meshConverter";
import log from "loglevel";

export class DiagramManager {
    private persistenceManager: IPersistenceManager = new IndexdbPersistenceManager("diagram");
    static onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly scene: Scene;
    private xr: WebXRExperienceHelper;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;
        this.persistenceManager.updateObserver.add(this.onRemoteEvent, -1, true, this);
        log.getLogger('DiagramManager').debug( "remote event observer added");
        this.persistenceManager.initialize();

        if (!DiagramManager.onDiagramEventObservable) {
            log.getLogger('DiagramManager').debug( "onDiagramEventObservable missing, recreated");
            DiagramManager.onDiagramEventObservable = new Observable();
        }
        if (DiagramManager.onDiagramEventObservable.hasObservers()) {
            log.getLogger('DiagramManager').debug("onDiagramEventObservable already has Observers, this shouldn't happen");
        } else {
            DiagramManager.onDiagramEventObservable.add(this.onDiagramEvent, -1, true, this);
            log.getLogger('DiagramManager').debug( "onDiagramEventObservable Observer added");
        }
        log.getLogger('DiagramManager').debug( "DiagramManager constructed");
    }


    private onRemoteEvent(event: DiagramEntity) {
        //const mesh = Toolbox.instance.newMesh(ToolType[Object.entries(ToolType).find(e => e[1] == event.template)[0]], event.id);
        log.getLogger('DiagramManager').debug(event);
        const mesh = MeshConverter.fromDiagramEntity(event, this.scene);
        if (event.parent) {
            mesh.parent = this.scene.getMeshById(event.parent);
        }
    }

    private onDiagramEvent(event: DiagramEvent) {
        log.getLogger("DiagramManager").debug(event);
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
            case DiagramEventType.CHANGECOLOR:
                this.persistenceManager.changeColor(event.oldColor, event.newColor);
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
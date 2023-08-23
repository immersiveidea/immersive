import {AbstractMesh, Color3, InstancedMesh, Mesh, Observable, PhysicsMotionType, Scene} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "../integration/iPersistenceManager";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {AppConfig} from "../util/appConfig";
import {Toolbox} from "../toolbox/toolbox";
import {PresentationManager} from "./presentationManager";
import {DiagramEntityActionManager} from "./diagramEntityActionManager";
import {diagramEventHandler} from "./diagramEventHandler";
import {deepCopy} from "../util/deepCopy";
import {applyPhysics} from "./functions/diagramShapePhysics";
import {applyScaling} from "./functions/applyScaling";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {fromDiagramEntity} from "./functions/fromDiagramEntity";


export class DiagramManager {
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly logger = log.getLogger('DiagramManager');
    private persistenceManager: IPersistenceManager = null;
    private readonly toolbox: Toolbox;
    private readonly scene: Scene;
    private readonly sounds: DiaSounds;
    private readonly controllers: Controllers;
    private readonly diagramEntityActionManager: DiagramEntityActionManager
    private presentationManager: PresentationManager;
    private _config: AppConfig;

    constructor(scene: Scene, controllers: Controllers, toolbox: Toolbox) {
        this.sounds = new DiaSounds(scene);
        this.scene = scene;
        this.toolbox = toolbox;
        this.controllers = controllers;
        this.presentationManager = new PresentationManager(this.scene);
        this.diagramEntityActionManager = new DiagramEntityActionManager(this.scene, this.sounds, this.controllers);

        if (this.onDiagramEventObservable.hasObservers()) {
            this.logger.warn("onDiagramEventObservable already has Observers, you should be careful");
        }
        this.toolbox.colorChangeObservable.add((evt) => {
            this.persistenceManager.changeColor(Color3.FromHexString(evt.oldColor), Color3.FromHexString(evt.newColor));
        }, -1, true, this, false);
        this.onDiagramEventObservable.add(this.onDiagramEvent, -1, true, this);
        this.logger.debug("DiagramManager constructed");

        scene.onMeshRemovedObservable.add((mesh) => {
            if (mesh?.metadata?.template) {
                if (mesh.metadata.template != '#connection-template') {
                    scene.meshes.forEach((m) => {
                        if (m?.metadata?.to == mesh.id || m?.metadata?.from == mesh.id) {
                            this.logger.debug("removing connection", m.id);
                            this.onDiagramEventObservable.notifyObservers({
                                type: DiagramEventType.REMOVE,
                                entity: toDiagramEntity(m)
                            });
                        }
                    });
                }
            }
        });
    }

    public get config(): AppConfig {
        return this._config;
    }
    public setPersistenceManager(persistenceManager: IPersistenceManager) {
        this.persistenceManager = persistenceManager;
        this._config = new AppConfig(persistenceManager);
        this.persistenceManager.updateObserver.add(this.onRemoteEvent, -1, true, this);
    }
    public createCopy(mesh: AbstractMesh, copy: boolean = false): AbstractMesh {
        let newMesh;
        if (!mesh.isAnInstance) {
            newMesh = new InstancedMesh("new", (mesh as Mesh));
        } else {
            newMesh = new InstancedMesh("new", (mesh as InstancedMesh).sourceMesh);
        }
        newMesh.actionManager = this.diagramEntityActionManager.manager;
        newMesh.position = mesh.absolutePosition.clone();
        if (mesh.absoluteRotationQuaternion) {
            newMesh.rotation = mesh.absoluteRotationQuaternion.toEulerAngles().clone();
        } else {
            this.logger.error("no rotation quaternion");
        }
        applyScaling(mesh, newMesh, copy, this.config.current?.createSnap);
        newMesh.material = mesh.material;
        newMesh.metadata = deepCopy(mesh.metadata);
        if (this.config.current?.physicsEnabled) {
            applyPhysics(this.sounds, newMesh, this.scene);
        }
        this.persistenceManager.add(newMesh);
        return newMesh;
    }

    private onRemoteEvent(event: DiagramEntity) {
        this.logger.debug(event);
        const toolMesh = this.scene.getMeshById("tool-" + event.template + "-" + event.color);
        if (!toolMesh && (event.template != '#connection-template')) {
            log.debug('no mesh found for ' + event.template + "-" + event.color, 'adding it');
            this.toolbox.updateToolbox(event.color);
        }
        const mesh = fromDiagramEntity(event, this.scene);
        mesh.actionManager = this.diagramEntityActionManager.manager;
        if (event.parent) {
            mesh.parent = this.scene.getMeshById(event.parent);
        }
        if (this.config.current?.physicsEnabled) {
            applyPhysics(this.sounds, mesh, this.scene, PhysicsMotionType.DYNAMIC);
        }
    }

    private onDiagramEvent(event: DiagramEvent) {
        diagramEventHandler(
            event, this.scene, this.toolbox, this.config.current.physicsEnabled,
            this.diagramEntityActionManager.manager, this.sounds, this.persistenceManager);
    }
}
import {AbstractMesh, ActionManager, InstancedMesh, Mesh, Observable, Scene, WebXRInputSource} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {AppConfig} from "../util/appConfig";
import {diagramEventHandler} from "./functions/diagramEventHandler";
import {deepCopy} from "../util/functions/deepCopy";
import {applyPhysics} from "./functions/diagramShapePhysics";
import {applyScaling} from "./functions/applyScaling";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {v4 as uuidv4} from 'uuid';
import {buildEntityActionManager} from "./functions/buildEntityActionManager";
import {isDiagramEntity} from "./functions/isDiagramEntity";
import {DefaultScene} from "../defaultScene";
import {DiagramMenuManager} from "./diagramMenuManager";
import {ClickMenu} from "../menus/clickMenu";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";


export class DiagramManager {
    private logger = log.getLogger('DiagramManager');
    public readonly _config: AppConfig;
    private readonly _controllers: Controllers;
    private readonly _diagramEntityActionManager: ActionManager;
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly _diagramMenuManager: DiagramMenuManager;
    private readonly _scene: Scene;

    constructor() {
        this._scene = DefaultScene.Scene;
        this._config = new AppConfig();
        this._controllers = new Controllers();
        this._diagramMenuManager = new DiagramMenuManager(this.onDiagramEventObservable, this._controllers, this._config);
        this._diagramEntityActionManager = buildEntityActionManager(this._controllers);
        this.onDiagramEventObservable.add(this.onDiagramEvent, DiagramEventObserverMask.FROM_DB, true, this);
        this.logger.debug("DiagramManager constructed");
        this._scene.onMeshRemovedObservable.add((mesh) => {
            if (isDiagramEntity(mesh)) {
                this.cleanupOrphanConnections(mesh)
            }
        });
        document.addEventListener('uploadImage', (event: CustomEvent) => {
            let position = {x: 0, y: 1.6, z: 0};
            if (event.detail.position) {
                position = {
                    x: event.detail.position.x,
                    y: event.detail.position.y,
                    z: event.detail.position.z
                }
            }
            const diagramEntity: DiagramEntity = {
                template: '#image-template',
                image: event.detail.data,
                text: event.detail.name,
                position: {x: 0, y: 1.6, z: 0},
                rotation: {x: 0, y: Math.PI, z: 0},
                scale: {x: 1, y: 1, z: 1},
            }

            console.log(diagramEntity);
            //const newMesh = buildMeshFromDiagramEntity(diagramEntity, this._scene);
            if (this.onDiagramEventObservable) {
                this.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: diagramEntity
                }, DiagramEventObserverMask.ALL);

                //this.onDiagramEventObservable.notifyObservers({type: DiagramEventType.ADD, entity: diagramEntity}, DiagramEventObserverMask.FROM_DB);
            }
        })
    }

    public get diagramMenuManager(): DiagramMenuManager {
        return this._diagramMenuManager;
    }

    public createClickMenu(mesh: AbstractMesh, grip: WebXRInputSource): ClickMenu {
        return this._diagramMenuManager.createClickMenu(mesh, grip);
    }
    private notifyAll(event: DiagramEvent) {
        this.onDiagramEventObservable.notifyObservers(event, DiagramEventObserverMask.ALL);
    }

    public get controllers(): Controllers {
        return this._controllers;
    }

    public createCopy(mesh: AbstractMesh, copy: boolean = false): AbstractMesh {
        let newMesh;
        if (!mesh.isAnInstance) {
            newMesh = new InstancedMesh('id' + uuidv4(), (mesh as Mesh));
        } else {
            newMesh = new InstancedMesh('id' + uuidv4(), (mesh as InstancedMesh).sourceMesh);
        }
        newMesh.id = 'id' + uuidv4();

        newMesh.actionManager = this._diagramEntityActionManager;
        newMesh.position = mesh.absolutePosition.clone();

        if (mesh.absoluteRotationQuaternion) {
            newMesh.rotation = mesh.absoluteRotationQuaternion.toEulerAngles().clone();
        } else {
            this.logger.error("no rotation quaternion");
        }
        applyScaling(mesh, newMesh, copy, this._config.current?.createSnap);
        newMesh.material = mesh.material;
        newMesh.metadata = deepCopy(mesh.metadata);
        if (this._config.current?.physicsEnabled) {
            applyPhysics(newMesh, this._scene);
        }
        return newMesh;
    }
    public get config(): AppConfig {
        return this._config;
    }

    private cleanupOrphanConnections(mesh: AbstractMesh) {
        if (mesh.metadata.template != '#connection-template') {
            this._scene.meshes.forEach((m) => {
                if (m?.metadata?.to == mesh.id || m?.metadata?.from == mesh.id) {
                    this.logger.debug("removing connection", m.id);
                    this.notifyAll({type: DiagramEventType.REMOVE, entity: toDiagramEntity(m)});
                }
            });
        }
    }

    private onDiagramEvent(event: DiagramEvent) {
        diagramEventHandler(
            event, this._scene, this._diagramMenuManager.toolbox, this._config.current.physicsEnabled,
            this._diagramEntityActionManager);
    }
}
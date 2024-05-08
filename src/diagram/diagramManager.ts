import {AbstractMesh, ActionManager, InstancedMesh, Mesh, Observable, Scene} from "@babylonjs/core";
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

        this._scene.onMeshRemovedObservable.add((mesh) => {
            cleanupOrphanConnections(mesh, this.onDiagramEventObservable);
        });
        document.addEventListener('uploadImage', (event: CustomEvent) => {
            const diagramEntity: DiagramEntity = {
                template: '#image-template',
                image: event.detail.data,
                text: event.detail.name,
                position: {x: 0, y: 1.6, z: 0},
                rotation: {x: 0, y: Math.PI, z: 0},
                scale: {x: 1, y: 1, z: 1},
            }
            //const newMesh = buildMeshFromDiagramEntity(diagramEntity, this._scene);
            if (this.onDiagramEventObservable) {
                this.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: diagramEntity
                }, DiagramEventObserverMask.ALL);
            }
        });
        this.logger.debug("DiagramManager constructed");
    }

    public get diagramMenuManager(): DiagramMenuManager {
        return this._diagramMenuManager;
    }

    public get controllers(): Controllers {
        return this._controllers;
    }


    public createCopy(mesh: AbstractMesh, copy: boolean = false): AbstractMesh {
        const newMesh = newInstanceFromMeshOrInstance(mesh);
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


    private onDiagramEvent(event: DiagramEvent) {
        diagramEventHandler(
            event, this._scene, this._diagramMenuManager.toolbox, this._config.current.physicsEnabled,
            this._diagramEntityActionManager);
    }
}

function newInstanceFromMeshOrInstance(mesh: AbstractMesh): AbstractMesh {
    if (!mesh.isAnInstance) {
        return new InstancedMesh('id' + uuidv4(), (mesh as Mesh));
    } else {
        return new InstancedMesh('id' + uuidv4(), (mesh as InstancedMesh).sourceMesh);
    }
}

function cleanupOrphanConnections(mesh: AbstractMesh, diagramEventObservable: Observable<DiagramEvent>) {
    if (isDiagramEntity(mesh) && mesh.metadata.template != '#connection-template') {
        mesh.getScene().meshes.forEach((m) => {
            if (m?.metadata?.to == mesh.id || m?.metadata?.from == mesh.id) {
                diagramEventObservable.notifyObservers({type: DiagramEventType.REMOVE, entity: toDiagramEntity(m)});
            }
        });
    }
}
import {AbstractMesh, ActionManager, InstancedMesh, Mesh, Observable, Scene, TransformNode} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "./types/diagramEntity";
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

const logger = log.getLogger('DiagramManager');
export enum DiagramEventObserverMask {
    ALL = -1,
    FROM_DB = 1,
    TO_DB = 2,
}
export class DiagramManager {
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
        logger.debug("DiagramManager constructed");
        this._scene.onMeshRemovedObservable.add((mesh) => {
            if (isDiagramEntity(mesh)) {
                this.cleanupOrphanConnections(mesh)
            }
        });
    }

    public get diagramMenuManager(): DiagramMenuManager {
        return this._diagramMenuManager;
    }

    public createClickMenu(mesh: AbstractMesh, grip: TransformNode): ClickMenu {
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
            logger.error("no rotation quaternion");
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
                    logger.debug("removing connection", m.id);
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
import {AbstractMesh, ActionManager, Color3, InstancedMesh, Mesh, Observable, Scene} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {AppConfig} from "../util/appConfig";
import {Toolbox} from "../toolbox/toolbox";
import {diagramEventHandler} from "./functions/diagramEventHandler";
import {deepCopy} from "../util/functions/deepCopy";
import {applyPhysics} from "./functions/diagramShapePhysics";
import {applyScaling} from "./functions/applyScaling";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {v4 as uuidv4} from 'uuid';
import {buildEntityActionManager} from "./functions/buildEntityActionManager";
import {isDiagramEntity} from "./functions/isDiagramEntity";
import {InputTextView} from "../information/inputTextView";
import {DefaultScene} from "../defaultScene";


export class DiagramManager {
    public readonly _config: AppConfig;
    private readonly _controllers: Controllers;
    private readonly diagramEntityActionManager: ActionManager;
    private readonly inputTextView: InputTextView;

    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly logger = log.getLogger('DiagramManager');
    private readonly toolbox: Toolbox;
    private readonly _scene: Scene;


    constructor() {
        this._scene = DefaultScene.Scene;
        this._config = new AppConfig();
        this._controllers = new Controllers();
        this.inputTextView = new InputTextView(this._controllers);
        this.inputTextView.onTextObservable.add((evt) => {
            const mesh = this._scene.getMeshById(evt.id);
            if (mesh) {
                const entity = toDiagramEntity(mesh);
                entity.text = evt.text;
                this.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.MODIFY,
                    entity: entity
                }, -1);
            } else {
                this.logger.error("mesh not found", evt.id);
            }
        });

        this.toolbox = new Toolbox();
        //this.presentationManager = new PresentationManager(this._scene);
        this.diagramEntityActionManager = buildEntityActionManager(this._controllers);

        if (this.onDiagramEventObservable.hasObservers()) {
            this.logger.warn("onDiagramEventObservable already has Observers, you should be careful");
        }
        this.toolbox.colorChangeObservable.add((evt) => {
            this.logger.debug(evt);
            this.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.CHANGECOLOR,
                oldColor: Color3.FromHexString(evt.oldColor), newColor: Color3.FromHexString(evt.newColor)
            }, 2);
        }, -1, true, this, false);
        this.onDiagramEventObservable.add(this.onDiagramEvent, 1, true, this);
        this.logger.debug("DiagramManager constructed");

        this._scene.onMeshRemovedObservable.add((mesh) => {
            if (isDiagramEntity(mesh)) {
                if (mesh.metadata.template != '#connection-template') {
                    this._scene.meshes.forEach((m) => {
                        if (m?.metadata?.to == mesh.id || m?.metadata?.from == mesh.id) {
                            this.logger.debug("removing connection", m.id);
                            this.onDiagramEventObservable.notifyObservers({
                                type: DiagramEventType.REMOVE,
                                entity: toDiagramEntity(m)
                            }, -1);
                        }
                    });
                }
            }
        });
    }

    public editText(mesh: AbstractMesh) {
        this.inputTextView.show(mesh);
    }

    public get controllers(): Controllers {
        return this._controllers;
    }

    public get config(): AppConfig {
        return this._config;
    }

    public get scene(): Scene {
        return this._scene;
    }

    public createCopy(mesh: AbstractMesh, copy: boolean = false): AbstractMesh {
        let newMesh;
        if (!mesh.isAnInstance) {
            newMesh = new InstancedMesh('id' + uuidv4(), (mesh as Mesh));
        } else {
            newMesh = new InstancedMesh('id' + uuidv4(), (mesh as InstancedMesh).sourceMesh);
        }
        newMesh.id = 'id' + uuidv4();

        newMesh.actionManager = this.diagramEntityActionManager;
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

    private onDiagramEvent(event: DiagramEvent) {
        diagramEventHandler(
            event, this._scene, this.toolbox, this._config.current.physicsEnabled,
            this.diagramEntityActionManager);
    }
}
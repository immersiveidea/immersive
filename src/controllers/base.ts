import {
    AbstractMesh,
    Scene,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramEvent, DiagramEventType} from "../diagram/types/diagramEntity";
import log from "loglevel";
import {ControllerEventType, Controllers} from "./controllers";
import {grabAndClone} from "./functions/grabAndClone";
import {ClickMenu} from "../menus/clickMenu";
import {displayDebug} from "../util/displayDebug";
import {motionControllerObserver} from "./functions/motionControllerObserver";
import {DefaultScene} from "../defaultScene";
import {DiagramEventObserverMask} from "../diagram/types/diagramEventObserverMask";
import {DiagramObject} from "../objects/diagramObject";
import {snapAll} from "./functions/snapAll";
import {MeshTypeEnum} from "../diagram/types/meshTypeEnum";
import {getMeshType} from "./functions/getMeshType";

const CLICK_TIME = 300;



export class Base {
    static stickVector = Vector3.Zero();
    protected xrInputSource: WebXRInputSource;
    protected speedFactor = 4;
    protected readonly scene: Scene;
    protected grabbedObject: DiagramObject = null;
    protected grabbedMesh: AbstractMesh = null;
    protected grabbedMeshType: MeshTypeEnum = null;
    private clickStart: number = 0;
    protected readonly xr: WebXRDefaultExperience;
    protected readonly diagramManager: DiagramManager;
    protected controllers: Controllers;
    private clickMenu: ClickMenu;
    private pickPoint: Vector3 = new Vector3();
    private meshUnderPointer: AbstractMesh;
    private logger = log.getLogger('Base');

    constructor(controller: WebXRInputSource,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager) {
        this.logger.debug('Base Controller Constructor called');
        this.xrInputSource = controller;
        this.controllers = diagramManager.controllers;
        this.scene = DefaultScene.Scene;
        this.xr = xr;
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.pickInfo.pickedMesh) {
                this.meshUnderPointer = pointerInfo.pickInfo.pickedMesh;
                if (this.diagramManager.getDiagramObject(pointerInfo.pickInfo.pickedMesh.id)) {
                    this.pickPoint.copyFrom(pointerInfo.pickInfo.pickedPoint);
                }
            }
        });
        this.diagramManager = diagramManager;

        //@TODO THis works, but it uses initGrip, not sure if this is the best idea
        this.xrInputSource.onMotionControllerInitObservable.add(motionControllerObserver, -1, false, this);
        this.controllers.controllerObservable.add((event) => {
            this.logger.debug(event);
            switch (event.type) {
                case ControllerEventType.PULSE:
                    if (event.gripId == this?.xrInputSource?.grip?.id) {
                        this.xrInputSource?.motionController?.pulse(.35, 50)
                            .then(() => {
                                this.logger.debug("pulse done");
                            });
                    }
                    break;
                case ControllerEventType.HIDE:
                    this.disable();
                    break;
                case ControllerEventType.SHOW:
                    this.enable();
                    break;
            }
        });
    }

    public disable() {
        this.scene.preventDefaultOnPointerDown = true;
        this.xrInputSource.motionController.rootMesh.setEnabled(false)
        this.xrInputSource.pointer.setEnabled(false);
    }

    public enable() {
        this.scene.preventDefaultOnPointerDown = false;
        this.xrInputSource.motionController.rootMesh.setEnabled(true);
        this.xrInputSource.pointer.setEnabled(true)
    }

    protected initClicker(trigger: WebXRControllerComponent) {
        this.logger.debug("initTrigger");
        trigger.onButtonStateChangedObservable.add(() => {
            if (trigger.changes.pressed) {
                if (trigger.pressed) {
                    if (this.clickStart == 0) {
                        this.clickStart = Date.now();
                        window.setTimeout(() => {
                            if (this.clickStart > 0) {
                                this.logger.debug("grabbing and cloning");
                                const clone = grabAndClone(this.diagramManager, this.meshUnderPointer, this.xrInputSource.motionController.rootMesh);
                                this.grabbedObject = clone;
                                this.grabbedMesh = clone.mesh;
                            }
                        }, 300, this);
                    }
                } else {
                    const clickEnd = Date.now();
                    if (this.clickStart > 0 && (clickEnd - this.clickStart) < CLICK_TIME) {
                        this.click();
                    } else {
                        if (this.grabbedObject || this.grabbedMesh) {
                            this.drop();
                        }
                    }
                    this.clickStart = 0;
                }
            }
        }, -1, false, this);
    }


    private grab() {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.xrInputSource.uniqueId);
        if (!mesh) {
            return;
        }
        this.grabbedMesh = mesh;
        this.grabbedMeshType = getMeshType(mesh, this.diagramManager);

        displayDebug(mesh);
        switch (this.grabbedMeshType) {
            case MeshTypeEnum.ENTITY:
                const diagramObject = this.diagramManager.getDiagramObject(mesh.id);
                if (diagramObject.isGrabbable) {
                    diagramObject.baseTransform.setParent(this.xrInputSource.motionController.rootMesh);
                    this.grabbedObject = diagramObject;
                }
                break;
            case MeshTypeEnum.HANDLE:
                this.grabbedMesh.setParent(this.xrInputSource.motionController.rootMesh);
                break;
            case MeshTypeEnum.TOOL:
                const clone = grabAndClone(this.diagramManager, mesh, this.xrInputSource.motionController.rootMesh);
                this.grabbedObject = clone;
                this.grabbedMesh = clone.mesh;

        }
    }

    private drop() {
        const mesh = this.grabbedMesh;
        if (!mesh) {
            return;
        }
        const diagramObject = this.grabbedObject;
        switch (this.grabbedMeshType) {
            case MeshTypeEnum.ENTITY:
                if (diagramObject) {
                    diagramObject.baseTransform.setParent(null);
                    snapAll(this.grabbedObject.baseTransform, this.diagramManager.config, this.pickPoint);
                    diagramObject.mesh.computeWorldMatrix(true);
                    const event: DiagramEvent =
                        {
                            type: DiagramEventType.DROP,
                            entity: diagramObject.diagramEntity
                        }
                    this.diagramManager.onDiagramEventObservable.notifyObservers(event, DiagramEventObserverMask.ALL);
                    diagramObject.mesh.computeWorldMatrix(false);
                }

                this.grabbedObject = null;
                this.grabbedMesh = null;
                this.grabbedMeshType = null;
                break;
            case MeshTypeEnum.TOOL:
                this.grabbedObject.baseTransform.setParent(null);
                snapAll(this.grabbedObject.baseTransform, this.diagramManager.config, this.pickPoint);
                diagramObject.mesh.computeWorldMatrix(true);
                const event: DiagramEvent =
                    {
                        type: DiagramEventType.DROP,
                        entity: diagramObject.diagramEntity
                    }
                this.diagramManager.onDiagramEventObservable.notifyObservers(event, DiagramEventObserverMask.ALL);
                diagramObject.mesh.computeWorldMatrix(false);
                this.grabbedObject = null;
                this.grabbedMesh = null;
                this.grabbedMeshType = null;
                break;
            case MeshTypeEnum.HANDLE:
                mesh.setParent(this.scene.getMeshByName("platform"));
                const location = {
                    position: {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z},
                    rotation: {x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z}
                }
                localStorage.setItem(mesh.id, JSON.stringify(location));
                this.grabbedMesh = null;
                this.grabbedMeshType = null;
                this.grabbedObject = null;
                break;
        }
    }

    private click() {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.xrInputSource.uniqueId);
        if (this.diagramManager.isDiagramObject(mesh)) {
            this.logger.debug("click on " + mesh.id);
            if (this.diagramManager.diagramMenuManager.connectionPreview) {
                this.diagramManager.diagramMenuManager.connect(mesh);

            } else {
                this.clickMenu = this.diagramManager.diagramMenuManager.createClickMenu(mesh, this.xrInputSource);
            }
        } else {
            this.logger.debug("click on nothing");
        }
    }

    private initGrip(grip: WebXRControllerComponent) {
        grip.onButtonStateChangedObservable.add(() => {
            if (grip.changes.pressed) {
                if (grip.pressed) {
                    this.grab();
                } else {
                    this.drop();
                }
            }
        });
    }
}
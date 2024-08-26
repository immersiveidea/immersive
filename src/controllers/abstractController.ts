import {
    AbstractMesh,
    Scene,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {DiagramManager} from "../diagram/diagramManager";
import log from "loglevel";

import {grabAndClone} from "./functions/grabAndClone";
import {ClickMenu} from "../menus/clickMenu";
import {motionControllerInitObserver} from "./functions/motionControllerInitObserver";
import {DefaultScene} from "../defaultScene";

import {DiagramObject} from "../diagram/diagramObject";
import {MeshTypeEnum} from "../diagram/types/meshTypeEnum";
import {getMeshType} from "./functions/getMeshType";
import {viewOnly} from "../util/functions/getPath";

import {ControllerEventType} from "./types/controllerEventType";
import {controllerObservable} from "./controllers";
import {grabMesh} from "../diagram/functions/grabMesh";
import {dropMesh} from "../diagram/functions/dropMesh";

const CLICK_TIME = 300;


export abstract class AbstractController {
    static stickVector = Vector3.Zero();
    protected readonly scene: Scene;
    protected readonly xr: WebXRDefaultExperience;
    protected readonly diagramManager: DiagramManager;
    protected xrInputSource: WebXRInputSource;
    protected speedFactor = 4;

    protected grabbedObject: DiagramObject = null;
    protected grabbedMesh: AbstractMesh = null;
    protected grabbedMeshType: MeshTypeEnum = null;


    private readonly _logger = log.getLogger('AbstractController');
    private _clickStart: number = 0;
    private _clickMenu: ClickMenu;
    private _pickPoint: Vector3 = new Vector3();
    private _meshUnderPointer: AbstractMesh;


    constructor(controller: WebXRInputSource,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager) {
        this._logger.debug('Base Controller Constructor called');
        this.xrInputSource = controller;
        this.scene = DefaultScene.Scene;
        this.xr = xr;

        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo?.pickInfo?.gripTransform?.id == this.xrInputSource?.grip?.id) {
                if (pointerInfo.pickInfo.pickedMesh) {
                    this._pickPoint.copyFrom(pointerInfo.pickInfo.pickedPoint);
                    this._meshUnderPointer = pointerInfo.pickInfo.pickedMesh;
                } else {
                    this._meshUnderPointer = null;
                }
            }
        });
        this.diagramManager = diagramManager;

        //@TODO THis works, but it uses initGrip, not sure if this is the best idea
        this.xrInputSource.onMotionControllerInitObservable.add(motionControllerInitObserver, -1, false, this);
        controllerObservable.add((event) => {
            this._logger.debug(event);
            switch (event.type) {
                case ControllerEventType.PULSE:
                    if (event.gripId == this?.xrInputSource?.grip?.id) {
                        this.xrInputSource?.motionController?.pulse(.35, 50)
                            .then(() => {
                                this._logger.debug("pulse done");
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
        this._logger.debug("initTrigger");
        trigger.onButtonStateChangedObservable.add(() => {
            if (viewOnly()) {
                return;
            }
            if (trigger.changes.pressed) {
                if (trigger.pressed) {
                    if (this.diagramManager.diagramMenuManager.scaleMenu.mesh == this._meshUnderPointer) {
                        return;
                    }

                    if (this._clickStart == 0) {
                        this._clickStart = Date.now();
                        window.setTimeout(() => {
                            if (this._clickStart > 0) {
                                this._logger.debug("grabbing and cloning");
                                const clone = grabAndClone(this.diagramManager, this._meshUnderPointer, this.xrInputSource.motionController.rootMesh);

                                this.grabbedObject = clone;
                                this.grabbedMesh = clone.mesh;
                                this.grabbedMeshType = getMeshType(clone.mesh, this.diagramManager);
                                this._meshUnderPointer = clone.mesh;
                                clone.grabbed = true;
                            }
                        }, 300, this);
                    }
                } else {
                    const clickEnd = Date.now();
                    if (this._clickStart > 0 && (clickEnd - this._clickStart) < CLICK_TIME) {
                        this.click();
                    } else {
                        if (this.grabbedObject || this.grabbedMesh) {
                            this.drop();
                        }
                    }
                    this._clickStart = 0;
                }
            }
        }, -1, false, this);
    }

    protected notifyObserver(value: number, controllerEventType: ControllerEventType): number {
        if (Math.abs(value) > .1) {
            controllerObservable.notifyObservers({
                type: controllerEventType,
                value: value * this.speedFactor
            });
            return 1;
        } else {
            return 0;
        }
    }

    protected initButton(button: WebXRControllerComponent, type: ControllerEventType) {
        if (button) {
            button.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    this._logger.debug(button.type, button.id, 'pressed');
                    controllerObservable.notifyObservers({type: type});
                }
            });
        }
    }

    private click() {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.xrInputSource.uniqueId);
        if (this.diagramManager.isDiagramObject(mesh)) {
            this._logger.debug("click on " + mesh.id);
            if (this.diagramManager.diagramMenuManager.connectionPreview) {
                this.diagramManager.diagramMenuManager.connect(mesh);

            } else {
                if (this._clickMenu) {
                    this._clickMenu.dispose();
                }
                this._clickMenu = this.diagramManager.diagramMenuManager.createClickMenu(mesh, this.xrInputSource);
            }
        } else {
            this._logger.debug("click on nothing");
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

    private grab() {
        if (viewOnly() || this._meshUnderPointer == null) {
            return;
        }
        const {
            grabbedMesh,
            grabbedObject,
            grabbedMeshType
        } = grabMesh(this._meshUnderPointer, this.diagramManager, this.xrInputSource.motionController.rootMesh);
        this.grabbedMesh = grabbedMesh;
        this.grabbedObject = grabbedObject;
        this.grabbedMeshType = grabbedMeshType;
    }

    private drop() {
        const dropped = dropMesh(this.grabbedMesh, this.grabbedObject, this._pickPoint, this.grabbedMeshType, this.diagramManager);
        if (dropped) {
            this.grabbedMesh = null;
            this.grabbedObject = null;
            this.grabbedMeshType = null;
        }
    }
}
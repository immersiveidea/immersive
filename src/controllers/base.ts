import {
    AbstractMesh,
    Mesh,
    PhysicsMotionType,
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
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {setupTransformNode} from "./functions/setupTransformNode";
import {reparent} from "./functions/reparent";
import {snapGridVal} from "../util/functions/snapGridVal";
import {snapRotateVal} from "../util/functions/snapRotateVal";
import {grabAndClone} from "./functions/grabAndClone";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";
import {ClickMenu} from "../menus/clickMenu";
import {displayDebug} from "../util/displayDebug";
import {beforeRenderObserver} from "./functions/beforeRenderObserver";
import {motionControllerObserver} from "./functions/motionControllerObserver";
import {handleWasGrabbed} from "./functions/handleWasGrabbed";
import {buildDrop} from "./functions/buildDrop";
import {pointable} from "./functions/pointable";
import {DefaultScene} from "../defaultScene";

const CLICK_TIME = 300;
export class Base {
    static stickVector = Vector3.Zero();
    protected controller: WebXRInputSource;
    protected speedFactor = 4;
    protected readonly scene: Scene;
    protected grabbedMesh: AbstractMesh = null;
    protected grabbedMeshParentId: string = null;
    protected previousParentId: string = null;
    protected previousRotation: Vector3 = null;
    protected previousScaling: Vector3 = null;
    protected previousPosition: Vector3 = null;
    private clickStart: number = 0;
    protected readonly xr: WebXRDefaultExperience;
    protected readonly diagramManager: DiagramManager;
    private logger: log.Logger;
    private lastPosition: Vector3 = null;
    protected controllers: Controllers;
    private clickMenu: ClickMenu;

    constructor(controller: WebXRInputSource,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager) {
        this.logger = log.getLogger('Base');
        this.logger.setLevel(this.logger.levels.DEBUG);
        this.controller = controller;
        this.controllers = diagramManager.controllers;
        this.scene = DefaultScene.Scene;
        this.xr = xr;
        this.diagramManager = diagramManager;
        this.scene.onBeforeRenderObservable.add(beforeRenderObserver, -1, false, this);
        this.controller.onMotionControllerInitObservable.add(motionControllerObserver, -1, false, this);
        this.controllers.controllerObserver.add((event) => {
            this.logger.debug(event);
            switch (event.type) {
                case ControllerEventType.PULSE:
                    if (event.gripId == this?.controller?.grip?.id) {
                        this.controller?.motionController?.pulse(.25, 30)
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
        this.controller.motionController.rootMesh.setEnabled(false)
        this.controller.pointer.setEnabled(false);
    }

    public enable() {
        this.scene.preventDefaultOnPointerDown = false;
        this.controller.motionController.rootMesh.setEnabled(true);
        this.controller.pointer.setEnabled(true)
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
                                this.grab(true);
                            }
                        }, 300, this);
                    }
                } else {
                    const clickEnd = Date.now();
                    if (this.clickStart > 0 && (clickEnd - this.clickStart) < CLICK_TIME) {
                        this.click();
                    }
                    this.drop();
                    this.clickStart = 0;
                }
            }
        }, -1, false, this);
    }

    private grab(cloneEntity: boolean = false) {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.controller.uniqueId);

        if (!mesh) {
            return;
        }
        let player = false;
        displayDebug(mesh);
        if (!isDiagramEntity(mesh)) {
            if (handleWasGrabbed(mesh)) {
                mesh && mesh.setParent(this.controller.motionController.rootMesh);
                this.grabbedMesh = mesh;
            } else {
                if (mesh?.parent?.parent?.metadata?.grabbable) {
                    if (mesh?.parent?.parent?.parent) {
                        mesh = (mesh?.parent?.parent?.parent as Mesh);
                        this.grabbedMesh = mesh;
                        player = true;
                    }
                } else {
                    return;
                }
            }
        } else {
            if (mesh?.metadata?.template == '#connection-template') {
                return;
            }
        }

        this.previousParentId = mesh?.parent?.id;
        this.logger.warn("grabbed " + mesh?.id + " parent " + this.previousParentId);
        this.previousRotation = mesh?.rotation.clone();
        this.previousScaling = mesh?.scaling.clone();
        this.previousPosition = mesh?.position.clone();

        if ((!mesh.metadata?.grabClone || player) && !cloneEntity) {
            if (mesh.physicsBody) {
                const transformNode = setupTransformNode(mesh, this.controller.motionController.rootMesh);
                mesh.physicsBody.setMotionType(PhysicsMotionType.ANIMATED);
                this.grabbedMeshParentId = transformNode.id;
            } else {
                mesh.setParent(this.controller.motionController.rootMesh);
            }
            this.grabbedMesh = mesh;
        } else {
            this.logger.debug("cloning " + mesh?.id);
            const clone = grabAndClone(this.diagramManager, mesh, this.controller.motionController.rootMesh);
            clone.newMesh.metadata.grabClone = false;
            clone.newMesh.metadata.tool = false;
            this.grabbedMeshParentId = clone.transformNode.id;
            this.grabbedMesh = clone.newMesh;
            this.previousParentId = null;
            const event: DiagramEvent = {
                type: DiagramEventType.ADD,
                entity: toDiagramEntity(clone.newMesh)
            }
            this.diagramManager.onDiagramEventObservable.notifyObservers(event, -1);
        }
    }

    private drop() {
        const mesh = this.grabbedMesh;
        if (!mesh) {
            return;
        }
        if (handleWasGrabbed(mesh)) {
            mesh.setParent(this.scene.getMeshByName("platform"));
            const location = {
                position: {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z},
                rotation: {x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z}
            }
            localStorage.setItem(mesh.id, JSON.stringify(location));
            return;
        }
        reparent(mesh, this.previousParentId, this.grabbedMeshParentId);
        this.grabbedMeshParentId = null;
        if (!mesh.physicsBody) {
            mesh.position = snapGridVal(mesh.position, this.diagramManager._config.current.gridSnap);
            mesh.rotation = snapRotateVal(mesh.rotation, this.diagramManager._config.current.rotateSnap);
        }
        this.previousParentId = null;
        this.previousScaling = null;
        this.previousRotation = null;
        this.previousPosition = null;
        this.grabbedMesh = null;
        if (isDiagramEntity(mesh) && (mesh?.metadata?.template.indexOf('#') == -1)) {
            return;
        }
        const event: DiagramEvent = buildDrop(mesh);

        const body = mesh?.physicsBody;
        if (body) {
            body.setMotionType(PhysicsMotionType.DYNAMIC);
            this.logger.debug(body.transformNode.absolutePosition);
            this.logger.debug(this.lastPosition);
            if (this.lastPosition) {
                body.setLinearVelocity(body.transformNode.absolutePosition.subtract(this.lastPosition).scale(20));
                //body.setLinearVelocity(this.lastPosition.subtract(body.transformNode.absolutePosition).scale(20));
                this.logger.debug(this.lastPosition.subtract(body.transformNode.absolutePosition).scale(20));
            }
        }
        this.diagramManager.onDiagramEventObservable.notifyObservers(event, -1);
    }

    private click() {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.controller.uniqueId);

        if (pointable(mesh)) {
            this.logger.debug("click on " + mesh.id);
            if (this.clickMenu && !this.clickMenu.isDisposed) {
                if (this.clickMenu.isConnecting) {
                    this.clickMenu.connect(mesh);
                    this.clickMenu = null;
                }
            } else {
                this.clickMenu = new ClickMenu(mesh, this.diagramManager, this.controller.grip);
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

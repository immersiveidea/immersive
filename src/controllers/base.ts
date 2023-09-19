import {
    AbstractMesh,
    HavokPlugin,
    Mesh,
    PhysicsMotionType,
    Scene,
    TransformNode,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";
import log from "loglevel";
import {ControllerEventType, Controllers} from "./controllers";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {setupTransformNode} from "./functions/setupTransformNode";
import {reparent} from "./functions/reparent";
import {snapGridVal} from "../util/functions/snapGridVal";
import {snapRotateVal} from "../util/functions/snapRotateVal";

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

    protected readonly xr: WebXRDefaultExperience;
    protected readonly diagramManager: DiagramManager;
    private logger: log.Logger;
    private lastPosition: Vector3 = null;
    protected controllers: Controllers;

    constructor(controller: WebXRInputSource,
                scene: Scene,
                xr: WebXRDefaultExperience,
                controllers: Controllers,
                diagramManager: DiagramManager) {
        this.logger = log.getLogger('Base');
        this.controller = controller;
        this.controllers = controllers;
        this.scene = scene;
        this.scene.onBeforeRenderObservable.add(() => {
            if (this?.grabbedMesh?.physicsBody) {
                const hk = (this.scene.getPhysicsEngine().getPhysicsPlugin() as HavokPlugin);
                this.lastPosition = this?.grabbedMesh?.physicsBody?.transformNode.absolutePosition.clone();
                if (this.grabbedMeshParentId) {
                    const parent = this.scene.getTransformNodeById(this.grabbedMeshParentId);
                    if (parent) {
                        hk.setPhysicsBodyTransformation(this.grabbedMesh.physicsBody, parent);
                        hk.sync(this.grabbedMesh.physicsBody);
                    } else {
                        this.logger.error("parent not found for " + this.grabbedMeshParentId);
                    }

                } else {
                    this.logger.warn("no parent id");
                }

            }
        }, -1, false, this);
        this.xr = xr;
        this.diagramManager = diagramManager;

        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-squeeze']) {
                this.initGrip(init.components['xr-standard-squeeze'])
            }
        }, -1, false, this);
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
                    ;
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

    private grab() {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.controller.uniqueId);
        if (!mesh) {
            return;
        }
        let player = false;
        const template = mesh?.metadata?.template;
        if (!template) {
            if (mesh?.metadata?.handle == true) {
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
            if (template == '#connection-template') {
                return;
            }
        }
        this.previousParentId = mesh?.parent?.id;
        this.logger.warn("grabbed " + mesh?.id + " parent " + this.previousParentId);
        this.previousRotation = mesh?.rotation.clone();
        this.previousScaling = mesh?.scaling.clone();
        this.previousPosition = mesh?.position.clone();

        if (("toolbox" != mesh?.parent?.parent?.id) || player) {
            if (mesh.physicsBody) {
                const transformNode = setupTransformNode(mesh, this.controller.motionController.rootMesh);
                mesh.physicsBody.setMotionType(PhysicsMotionType.ANIMATED);
                this.grabbedMeshParentId = transformNode.id;
            } else {
                mesh.setParent(this.controller.motionController.rootMesh);
            }

            this.grabbedMesh = mesh;
        } else {
            const newMesh = this.diagramManager.createCopy(mesh);
            const transformNode = new TransformNode("grabAnchor, this.scene");
            transformNode.id = "grabAnchor";
            transformNode.position = newMesh.position.clone();
            if (newMesh.rotationQuaternion) {
                transformNode.rotationQuaternion = newMesh.rotationQuaternion.clone();
            } else {
                transformNode.rotation = newMesh.rotation.clone();
            }
            transformNode.setParent(this.controller.motionController.rootMesh);
            newMesh.setParent(transformNode);
            this.grabbedMeshParentId = transformNode.id;
            this.grabbedMesh = newMesh;
            this.previousParentId = null;
            const event: DiagramEvent = {
                type: DiagramEventType.ADD,
                entity: toDiagramEntity(newMesh)
            }
            this.diagramManager.onDiagramEventObservable.notifyObservers(event, -1);
        }
    }

    private toolboxHandleWasGrabbed(mesh: AbstractMesh): boolean {
        if (!mesh?.metadata?.template
            && mesh?.metadata?.handle == true) {
            this.grabbedMesh = null;
            this.previousParentId = null;
            mesh.setParent(null);
            return true;
        } else {
            return false;
        }
    }
    private drop() {
        const mesh = this.grabbedMesh;
        if (!mesh) {
            return;
        }
        if (this.toolboxHandleWasGrabbed(mesh)) {
            return;
        }

        reparent(mesh, this.previousParentId, this.grabbedMeshParentId);
        this.grabbedMeshParentId = null;

        if (!mesh.physicsBody) {
            mesh.position = snapGridVal(mesh.position, this.diagramManager.config.current.gridSnap);
            mesh.rotation = snapRotateVal(mesh.rotation, this.diagramManager.config.current.rotateSnap);
        }
        this.previousParentId = null;
        this.previousScaling = null;
        this.previousRotation = null;
        this.previousPosition = null;
        this.grabbedMesh = null;
        if (mesh?.metadata?.template && (mesh?.metadata?.template.indexOf('#') == -1)) {
            return;
        }
        const entity = toDiagramEntity(mesh);
        const event: DiagramEvent = {
            type: DiagramEventType.DROP,
            entity: entity
        }


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
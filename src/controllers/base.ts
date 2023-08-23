import {
    AbstractMesh,
    HavokPlugin,
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
import {Controllers} from "./controllers";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";

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
            if (event.type == 'pulse') {
                this.logger.debug(event);
                if (event.gripId == this?.controller?.grip?.id) {
                    this.controller?.motionController?.pulse(.25, 30)
                        .then(() => {
                            this.logger.debug("pulse done");
                        });
                }
            }
        });
    }

    public disable() {
        this.controller.motionController.rootMesh.setEnabled(false);
        this.controller.pointer.setEnabled(false);
    }

    public enable() {
        this.controller.motionController.rootMesh.setEnabled(true);
        this.controller.pointer.setEnabled(true);
    }

    private setupTransformNode(mesh: TransformNode) {
        const transformNode = new TransformNode("grabAnchor, this.scene");
        transformNode.id = "grabAnchor";
        transformNode.position = mesh.position.clone();
        transformNode.rotationQuaternion = mesh.rotationQuaternion.clone();
        transformNode.setParent(this.controller.motionController.rootMesh);
        return transformNode;
    }

    private grab(mesh: AbstractMesh) {

        if (this.xr.pointerSelection.getMeshUnderPointer) {
            mesh = this.xr.pointerSelection.getMeshUnderPointer(this.controller.uniqueId);
        }
        if (!mesh) {
            return;
        }
        const template = mesh?.metadata?.template;
        if (!template) {
            if (mesh?.id == "handle") {
                mesh && mesh.setParent(this.controller.motionController.rootMesh);
                this.grabbedMesh = mesh;
            } else {
                return;
            }
        } else {
            if (template == '#connection-template') {
                return;
            }
        }
        this.previousParentId = mesh?.parent?.id;
        this.previousRotation = mesh?.rotation.clone();
        this.previousScaling = mesh?.scaling.clone();
        this.previousPosition = mesh?.position.clone();

        if ("toolbox" != mesh?.parent?.parent?.id) {
            if (mesh.physicsBody) {
                const transformNode = this.setupTransformNode(mesh);
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
            this.grabbedMeshParentId = transformNode.id;


            //newMesh && newMesh.setParent(this.controller.motionController.rootMesh);
            this.grabbedMesh = newMesh;
            this.previousParentId = null;
            const event: DiagramEvent = {
                type: DiagramEventType.ADD,
                entity: toDiagramEntity(newMesh)
            }
            this.diagramManager.onDiagramEventObservable.notifyObservers(event);

        }
    }

    private handleGrabbed(mesh: AbstractMesh): boolean {
        if (!mesh?.metadata?.template
            && mesh?.id == "handle") {
            //mesh && mesh.setParent(null);
            this.grabbedMesh = null;
            this.previousParentId = null;
            mesh.setParent(null);
            return true;
        } else {
            return false;
        }
    }

    private reparent(mesh: AbstractMesh) {
        if (this.previousParentId) {
            const parent = this.scene.getMeshById(this.previousParentId);
            if (parent) {
                //mesh && mesh.setParent(this.scene.getMeshById(this.previousParentId));
                log.getLogger("Base").warn("Base", "Have not implemented snapping to parent yet");
                //@note: this is not implemented yet
            } else {
                mesh.setParent(null);
            }
        } else {
            const parent = this.scene.getTransformNodeById(this.grabbedMeshParentId);
            if (parent) {
                this.grabbedMeshParentId = null;
                parent.dispose();
            } else {
                mesh.setParent(null);
            }
        }
    }

    private drop() {
        const mesh = this.grabbedMesh;
        if (!mesh) {
            return;
        }
        if (this.handleGrabbed(mesh)) {
            return;
        }

        this.reparent(mesh);
        if (!mesh.physicsBody) {
            mesh.position = this.diagramManager.config.snapGridVal(mesh.position, this.diagramManager.config.current.gridSnap);
            mesh.rotation = this.diagramManager.config.snapRotateVal(mesh.rotation, this.diagramManager.config.current.rotateSnap);
        }
        this.previousParentId = null;
        this.previousScaling = null;
        this.previousRotation = null;
        this.previousPosition = null;
        this.grabbedMesh = null;
        if (mesh?.metadata?.template.indexOf('#') == -1) {
            return;
        }
        const entity = toDiagramEntity(mesh);
        const event: DiagramEvent = {
            type: DiagramEventType.DROP,
            entity: entity
        }

        this.diagramManager.onDiagramEventObservable.notifyObservers(event);
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
    }

    private initGrip(grip: WebXRControllerComponent) {
        grip.onButtonStateChangedObservable.add(() => {
            if (grip.changes.pressed) {
                if (grip.pressed) {
                    this.grab(this.scene.meshUnderPointer);
                } else {
                    this.drop();
                }
            }
        });
    }
}
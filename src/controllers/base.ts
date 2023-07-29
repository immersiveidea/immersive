import {
    AbstractMesh,
    Scene,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {MeshConverter} from "../diagram/meshConverter";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";
import log from "loglevel";
import {AppConfig} from "../util/appConfig";
import {Controllers} from "./controllers";


export class Base {
    static stickVector = Vector3.Zero();
    protected controller: WebXRInputSource;
    protected speedFactor = 4;
    protected readonly scene: Scene;
    protected grabbedMesh: AbstractMesh = null;
    protected previousParent: string = null;
    protected previousRotation: Vector3 = null;
    protected previousScaling: Vector3 = null;
    protected previousPosition: Vector3 = null;

    protected readonly xr: WebXRDefaultExperience;
    protected readonly diagramManager: DiagramManager;
    private logger: log.Logger;
    constructor(controller: WebXRInputSource,
                scene: Scene,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager) {
        this.logger = log.getLogger('Base');
        this.controller = controller;

        this.scene = scene;
        this.xr = xr;
        this.diagramManager = diagramManager;
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-trigger']) {
                init.components['xr-standard-trigger']
                    .onButtonStateChangedObservable
                    .add(() => {

                    });
            }
            this.initGrip(init.components['xr-standard-squeeze']);
        });
        Controllers.controllerObserver.add((event) => {
            if (event.type == 'pulse') {
                this.logger.debug(event);
                if (event.gripId == this.controller.grip.id) {
                    this.controller.motionController.pulse(.25, 30);
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

    private initGrip(grip: WebXRControllerComponent) {
        grip.onButtonStateChangedObservable.add(() => {
            if (grip.changes.pressed) {
                if (grip.pressed) {
                    let mesh = this.scene.meshUnderPointer;
                    if (this.xr.pointerSelection.getMeshUnderPointer) {
                        mesh = this.xr.pointerSelection.getMeshUnderPointer(this.controller.uniqueId);
                    }
                    if (!mesh) {
                        return;
                    }
                    if (!mesh?.metadata?.template) {
                        if (mesh.id == "handle") {
                            mesh && mesh.setParent(this.controller.motionController.rootMesh);
                            this.grabbedMesh = mesh;
                        } else {
                            return;
                        }

                    }
                    this.previousParent = mesh?.parent?.id;
                    this.previousRotation = mesh?.rotation.clone();
                    this.previousScaling = mesh?.scaling.clone();
                    this.previousPosition = mesh?.position.clone();

                    if ("toolbox" != mesh?.parent?.parent?.id) {
                        mesh && mesh.setParent(this.controller.motionController.rootMesh);
                        this.grabbedMesh = mesh;
                    } else {
                        const config = AppConfig.config;
                        const newMesh = this.diagramManager.createCopy(mesh);
                        newMesh.position = mesh.absolutePosition.clone();
                        newMesh.rotation = mesh.absoluteRotationQuaternion.toEulerAngles().clone();
                        newMesh.scaling = config.createSnapVal;
                        newMesh.material = mesh.material;
                        newMesh.metadata = mesh.metadata;
                        newMesh && newMesh.setParent(this.controller.motionController.rootMesh);
                        const event: DiagramEvent = {
                            type: DiagramEventType.ADD,
                            entity: MeshConverter.toDiagramEntity(newMesh)
                        }
                        this.diagramManager.onDiagramEventObservable.notifyObservers(event);
                        this.grabbedMesh = newMesh;
                        this.previousParent = null;
                    }
                } else {
                    let mesh = this.scene.meshUnderPointer;
                    if (this.xr.pointerSelection.getMeshUnderPointer) {
                        mesh = this.xr.pointerSelection.getMeshUnderPointer(this.controller.uniqueId);
                    }
                    if (!this.grabbedMesh) {
                        log.debug("controllers", "no grabbed mesh");
                        return;
                    }
                    if (mesh?.id != this?.grabbedMesh?.id) {
                        log.debug("controllers", "not the same mesh");
                    }
                    mesh = this.grabbedMesh;
                    if (!mesh?.metadata?.template) {
                        if (mesh.id == "handle") {
                            mesh && mesh.setParent(null);
                            this.grabbedMesh = null;
                            this.previousParent = null;
                            return;
                        }
                    }
                    const config = AppConfig.config;
                    const snappedRotation = config.snapRotateVal(mesh.absoluteRotationQuaternion.toEulerAngles().clone());
                    const snappedPosition = config.snapGridVal(mesh.absolutePosition.clone());
                    if (this.previousParent) {
                        const p = this.scene.getMeshById(this.previousParent);
                        if (p) {
                            mesh && mesh.setParent(this.scene.getMeshById(this.previousParent));
                            log.getLogger("Base").warn("Base", "Have not implemented snapping to parent yet");
                            //@note: this is not implemented yet
                        } else {
                            mesh && mesh.setParent(null);
                            mesh.rotation = snappedRotation;
                            mesh.position = snappedPosition;
                        }
                    } else {
                        mesh && mesh.setParent(null);
                        mesh.rotation = snappedRotation;
                        mesh.position = snappedPosition;
                    }
                    const entity = MeshConverter.toDiagramEntity(mesh);
                    const event: DiagramEvent = {
                        type: DiagramEventType.DROP,
                        entity: entity
                    }
                    this.previousParent = null;
                    this.previousScaling = null;
                    this.previousRotation = null;
                    this.previousPosition = null;
                    this.diagramManager.onDiagramEventObservable.notifyObservers(event);
                }
            }
        });
    }

}
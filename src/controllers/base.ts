import {
    AbstractMesh,
    Angle,
    InstancedMesh,
    Mesh,
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
import round from "round";


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

    constructor(controller: WebXRInputSource, scene: Scene, xr: WebXRDefaultExperience) {
        this.controller = controller;
        this.scene = scene;
        this.xr = xr;

        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-trigger']) {
                init.components['xr-standard-trigger']
                    .onButtonStateChangedObservable
                    .add(() => {

                    });
            }
            this.initGrip(init.components['xr-standard-squeeze']);
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

    private createCopy(mesh: AbstractMesh) {
        if (!mesh.isAnInstance) {
            return new InstancedMesh("new", (mesh as Mesh));
        } else {
            return new InstancedMesh("new", (mesh as InstancedMesh).sourceMesh);
        }

    }

    static snapRotation(rotation): Vector3 {
        const config = AppConfig.config;
        if (config.rotateSnap == 0) {
            return rotation;
        }
        rotation.x = this.CalcToSnap(rotation.x, config.rotateSnap);
        rotation.y = this.CalcToSnap(rotation.y, config.rotateSnap);
        rotation.z = this.CalcToSnap(rotation.z, config.rotateSnap);
        return rotation;
    }

    static snapPosition(position): Vector3 {
        const config = AppConfig.config;
        if (config.gridSnap == 0) {
            return position;
        }
        position.x = round(position.x, config.gridSnap);
        position.y = round(position.y, config.gridSnap);
        position.z = round(position.z, config.gridSnap);
        return position;
    }

    static CalcToSnap(val, snap) {
        const deg = Angle.FromRadians(val).degrees();
        const snappedDegrees = round(deg, snap);
        log.getLogger('Base').debug("deg", val, deg, snappedDegrees, snap);
        return Angle.FromDegrees(snappedDegrees).radians();
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
                        const newMesh = this.createCopy(mesh);
                        newMesh.position = mesh.absolutePosition.clone();
                        newMesh.rotation = mesh.absoluteRotationQuaternion.toEulerAngles().clone();
                        newMesh.scaling = mesh.absoluteScaling.clone();
                        newMesh.material = mesh.material;
                        newMesh.metadata = mesh.metadata;
                        newMesh && newMesh.setParent(this.controller.motionController.rootMesh);

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
                    const snappedRotation = Base.snapRotation(mesh.absoluteRotationQuaternion.toEulerAngles().clone());
                    const snappedPosition = Base.snapPosition(mesh.absolutePosition.clone());
                    if (this.previousParent) {
                        const p = this.scene.getMeshById(this.previousParent);
                        if (p) {
                            mesh && mesh.setParent(this.scene.getMeshById(this.previousParent));
                        } else {
                            mesh && mesh.setParent(null);

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
                    DiagramManager.onDiagramEventObservable.notifyObservers(event);
                }
            }
        });
    }

}
import {
    AbstractMesh,
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
import log from 'loglevel';

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
    private createCopy(mesh: AbstractMesh) {
        if (!mesh.isAnInstance) {
            return  new InstancedMesh("new", (mesh as Mesh));
        } else {
            return  new InstancedMesh("new", (mesh as InstancedMesh).sourceMesh);
        }

    }
    private initGrip(grip: WebXRControllerComponent) {
        grip.onButtonStateChangedObservable.add(() => {
            if (grip.changes.pressed) {
                if (grip.pressed){
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
                        console.log("no grabbed mesh");
                        return;
                    }
                    if (mesh?.id != this?.grabbedMesh?.id) {
                        console.log("not the same mesh");
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

                    if (this.previousParent) {
                        const p = this.scene.getMeshById(this.previousParent);
                        if (p) {
                            mesh && mesh.setParent(this.scene.getMeshById(this.previousParent));
                        } else {
                            mesh && mesh.setParent(null);
                        }
                    } else {
                        mesh && mesh.setParent(null)
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
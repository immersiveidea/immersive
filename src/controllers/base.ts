import {PhysicsBody, Vector3, WebXRCamera, WebXRInputSource} from "@babylonjs/core";

export class Base {
    protected controller: WebXRInputSource;
    protected stickVector: Vector3;
    protected body: PhysicsBody;
    protected camera: WebXRCamera;
    protected speedFactor = 4;

    constructor(controller:
                    WebXRInputSource) {
        this.controller = controller;
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-trigger']) {
                init.components['xr-standard-trigger'].onButtonStateChangedObservable.add((value) => {
                    if (value.value == 1) {
                        console.log(value);
                    }
                });
            }
        });
    }

    setRig(body: PhysicsBody) {
        this.body = body;
    }

    setCamera(camera: WebXRCamera) {
        this.camera = camera;
    }

    setStickVector(vector: Vector3) {
        this.stickVector = vector;
    }
}
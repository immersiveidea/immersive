import {Quaternion, Vector3, WebXRInputSource} from "@babylonjs/core";
import {Base} from "./base";

export class Left extends Base {
    private x90 = Quaternion.RotationAxis(Vector3.Up(), 1.5708);

    constructor(controller:
                    WebXRInputSource) {
        super(controller);
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    const ray = this.camera.getForwardRay();
                    if (Math.abs(value.x) > .1) {
                        const direction = ray.direction.applyRotationQuaternion(this.x90).scale(value.x*this.speedFactor);
                        this.body.setLinearVelocity(direction);
                        this.stickVector.x = 1;
                    } else {
                        this.stickVector.x = 0;
                    }
                    if (Math.abs(value.y) > .1) {
                        let direction = Vector3.Zero();
                        this.body.getLinearVelocityToRef(direction);
                        direction.y = (value.y*-1*this.speedFactor);
                        this.body.setLinearVelocity(direction);
                        this.stickVector.y = 1;
                    } else {
                        this.stickVector.y = 0;
                    }

                    if (this.stickVector.equals(Vector3.Zero())) {
                        this.body.setLinearVelocity(Vector3.Zero());
                    } else {

                    }

                });
            }
        });

    }
}
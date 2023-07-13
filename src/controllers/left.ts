import {Vector3, WebXRInputSource} from "@babylonjs/core";
import {Base} from "./base";

export class Left extends Base {


    constructor(controller:
                    WebXRInputSource) {
        super(controller);
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {

                    if (Math.abs(value.x) > .1) {
                        this.rig.leftright(value.x*this.speedFactor);
                        Base.stickVector.x = 1;
                    } else {
                        Base.stickVector.x = 0;
                    }
                    if (Math.abs(value.y) > .1) {
                        this.rig.updown(value.y*this.speedFactor);
                        Base.stickVector.y = 1;
                    } else {
                        Base.stickVector.y = 0;
                    }

                    if (Base.stickVector.equals(Vector3.Zero())) {
                        this.rig.updown(0);
                        this.rig.leftright(0)
                    } else {

                    }

                });
            }
        });

    }
}
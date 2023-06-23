import {Base} from "./base";
import {Vector3, WebXRInputSource} from "@babylonjs/core";

export class Right extends Base {
    private bmenu: any;
    constructor(controller:
                    WebXRInputSource) {
        super(controller);

        this.controller.onMotionControllerInitObservable.add((init)=> {
            if (init.components['b-button']) {
                init.components['b-button'].onButtonStateChangedObservable.add((value)=>{
                   if (value.pressed) {

                   }
                });
            }
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    const ray = this.camera.getForwardRay();
                    if (Math.abs(value.x) > .1) {
                        this.body.setAngularVelocity(Vector3.Up().scale(value.x));
                    } else {
                        this.body.setAngularVelocity(Vector3.Zero());
                    }
                    if (Math.abs(value.y) > .1) {
                        this.body.setLinearVelocity(ray.direction.scale(value.y*-1*this.speedFactor));
                        this.stickVector.z = 1;
                    } else {
                        this.stickVector.z = 0;
                    }
                    if (this.stickVector.equals(Vector3.Zero())) {
                        this.body.setLinearVelocity(Vector3.Zero());
                    }
                });
            }

        });
    }
    public setBMenu(menu: any) {
        this.bmenu = menu;
    }

}
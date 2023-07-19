import {Vector3, WebXRInputSource} from "@babylonjs/core";

export class Base {
    static stickVector = Vector3.Zero();
    protected controller: WebXRInputSource;
    protected speedFactor = 4;

    constructor(controller:
                    WebXRInputSource) {
        this.controller = controller;
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-trigger']) {
                init.components['xr-standard-trigger']
                    .onButtonStateChangedObservable
                    .add((value) => {
                        if (value.value == 1) {
                            console.log(value);
                        }
                    });
            }
        });
    }
    public mesh() {
        return this.controller.grip;
    }
}
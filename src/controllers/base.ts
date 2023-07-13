import {PhysicsBody, Vector3, WebXRCamera, WebXRInputSource} from "@babylonjs/core";
import {Rigplatform} from "./rigplatform";

export class Base {
    static stickVector = Vector3.Zero();
    protected controller: WebXRInputSource;
    protected rig: Rigplatform;
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
    setRig(rig: Rigplatform) {
        this.rig = rig;
    }
}
import {Vector3, WebXRInputSource} from "@babylonjs/core";
import {Base} from "./base";
import {Controllers} from "./controllers";


export class Left extends Base {
    public static instance: Left;

    constructor(controller:
                    WebXRInputSource) {
        super(controller);

        Left.instance = this;
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    if (!Controllers.movable) {
                        this.moveRig(value);
                    } else {
                        this.moveMovable(value);
                    }


                });
            }
        });

    }

    private moveMovable(value: { x: number, y: number }) {
        if (Math.abs(value.x) > .1) {
            Controllers.movable.position.x += .005 * Math.sign(value.x);
        } else {

        }
        if (Math.abs(value.y) > .1) {
            Controllers.movable.position.y += -.005 * Math.sign(value.y);
        } else {

        }
    }

    private moveRig(value: { x: number, y: number }) {
        if (Math.abs(value.x) > .1) {
            Controllers.controllerObserver.notifyObservers({type: 'leftright', value: value.x * this.speedFactor});
            Base.stickVector.x = 1;
        } else {
            Base.stickVector.x = 0;
        }
        if (Math.abs(value.y) > .1) {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: value.y * this.speedFactor});
            Base.stickVector.y = 1;
        } else {
            Base.stickVector.y = 0;
        }

        if (Base.stickVector.equals(Vector3.Zero())) {
            Controllers.controllerObserver.notifyObservers({type: 'leftright', value: 0});
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
        } else {

        }
    }
}
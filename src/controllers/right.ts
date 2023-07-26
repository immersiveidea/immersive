import {Base} from "./base";
import {
    Angle,
    Scene,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {ControllerMovementMode, Controllers} from "./controllers";

export class Right extends Base {
    public static instance: Right;

    constructor(controller:
                    WebXRInputSource, scene: Scene, xr: WebXRDefaultExperience) {
        super(controller, scene, xr);
        Right.instance = this;
        this.controller.onMotionControllerInitObservable.add((init) => {
            this.initTrigger(init.components['xr-standard-trigger']);
            this.initBButton(init.components['b-button']);
            this.initAButton(init.components['a-button']);
            this.initThumbstick(init.components['xr-standard-thumbstick']);
        });


    }
    private initBButton(bbutton: WebXRControllerComponent) {
        if (bbutton) {
            bbutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    Controllers.controllerObserver.notifyObservers({type: 'b-button', value: button.value});
                }
            });
        }
    }

    private initTrigger(trigger: WebXRControllerComponent) {
        if (trigger) {
            trigger
                .onButtonStateChangedObservable
                .add((button) => {
                    if (button.pressed) {
                        Controllers.controllerObserver.notifyObservers({type: 'trigger', value: button.value});
                    }
                });
        }
    }

    private initAButton(abutton: WebXRControllerComponent) {
        if (abutton) {
            abutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    Controllers.controllerObserver.notifyObservers({type: 'menu'});
                }
            });
        }
    }

    private initThumbstick(thumbstick: WebXRControllerComponent) {
        if (thumbstick) {
            thumbstick.onAxisValueChangedObservable.add((value) => {
                if (!Controllers.movable) {
                    this.moveRig(value);
                } else {
                    if (Controllers.movementMode == ControllerMovementMode.ROTATE) {
                        this.rotateMovable(value);
                    } else {
                        this.moveMovable(value);
                    }
                }
            });
            thumbstick.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    Controllers.controllerObserver.notifyObservers({type: 'increaseVelocity', value: value.value});
                }
            });
        }
    }

    private moveRig(value) {
        if (Math.abs(value.x) > .1) {
            Controllers.controllerObserver.notifyObservers({type: 'turn', value: value.x});
        } else {
            Controllers.controllerObserver.notifyObservers({type: 'turn', value: 0});
        }
        if (Math.abs(value.y) > .1) {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: value.y * this.speedFactor});
            Base.stickVector.z = 1;
        } else {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
            Base.stickVector.z = 0;
        }
        if (Base.stickVector.equals(Vector3.Zero())) {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
        }
    }

    private rotateMovable(value: { x: number; y: number }) {
        if (Math.abs(value.y) > .1) {
            Controllers.movable.rotation.x +=
                Angle.FromDegrees(Math.sign(value.y)).radians();
            Controllers.movable.rotation.x = this.fixRadians(Controllers.movable.rotation.x);
        }
        if (Math.abs(value.x) > .1) {
            Controllers.movable.rotation.z +=
                Angle.FromDegrees(Math.sign(value.x)).radians();
            Controllers.movable.rotation.z = this.fixRadians(Controllers.movable.rotation.z);
        }
    }
    private fixRadians(value: number) {
        if (value > 2 * Math.PI) {
            return value - 2 * Math.PI;
        } else {
            return value;
        }
    }
    private moveMovable(value: { x: number; y: number }) {
        if (Math.abs(value.y) > .1) {
            Controllers.movable.position.z += Math.sign(value.y) * -.005;
        }
        if (Math.abs(value.x) > .1) {
            Controllers.movable.position.x += Math.sign(value.x) * .005;
        }
    }
}
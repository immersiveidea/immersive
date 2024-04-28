import {Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {Base} from "./base";
import {ControllerEventType} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {DefaultScene} from "../defaultScene";


export class Left extends Base {
    private leftLogger = log.getLogger('Left');
    constructor(controller:
                    WebXRInputSource, xr: WebXRDefaultExperience, diagramManager: DiagramManager) {
        super(controller, xr, diagramManager);
        const scene = DefaultScene.Scene;
        this.xrInputSource.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    this.leftLogger.trace(`thumbstick moved ${value.x}, ${value.y}`);
                    if (!this.controllers.movable) {
                        this.moveRig(value);
                    } else {
                        this.moveMovable(value);
                    }
                });
                this.initXButton(init.components['x-button']);
                this.initYButton(init.components['y-button']);
                this.initTrigger(init.components['xr-standard-trigger']);
                init.components['xr-standard-thumbstick'].onButtonStateChangedObservable.add((value) => {
                    if (value.pressed) {
                        this.leftLogger.trace('Left', 'thumbstick changed');
                        this.controllers.controllerObservable.notifyObservers({
                            type: ControllerEventType.DECREASE_VELOCITY,
                            value: value.value
                        });
                    }
                });
            }
        });

    }

    private initTrigger(trigger: WebXRControllerComponent) {
        if (trigger) {
            trigger
                .onButtonStateChangedObservable
                .add((button) => {
                    this.leftLogger.trace('trigger pressed');
                    this.controllers.controllerObservable.notifyObservers({
                        type: ControllerEventType.TRIGGER,
                        value: button.value,
                        controller: this.xrInputSource
                    });
                }, -1, false, this);
        }
    }

    private initXButton(xbutton: WebXRControllerComponent) {
        if (xbutton) {
            xbutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    this.leftLogger.trace('X button pressed');
                    this.controllers.controllerObservable.notifyObservers({
                        type: ControllerEventType.X_BUTTON,
                        value: button.value
                    });
                }
            });
        }
    }

    private initYButton(ybutton: WebXRControllerComponent) {
        if (ybutton) {
            ybutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    this.leftLogger.trace('Y button pressed');
                    this.controllers.controllerObservable.notifyObservers({
                        type: ControllerEventType.Y_BUTTON,
                        value: button.value
                    });
                }
            });
        }
    }

    private moveMovable(value: { x: number, y: number }) {
        if (Math.abs(value.x) > .1) {
            this.controllers.movable.position.x += .005 * Math.sign(value.x);
        } else {

        }
        if (Math.abs(value.y) > .1) {
            this.controllers.movable.position.y += -.005 * Math.sign(value.y);
        } else {

        }
    }

    private moveRig(value: { x: number, y: number }) {
        if (Math.abs(value.x) > .1) {
            this.controllers.controllerObservable.notifyObservers({
                type: ControllerEventType.LEFT_RIGHT,
                value: value.x * this.speedFactor
            });
            Base.stickVector.x = 1;
        } else {
            Base.stickVector.x = 0;
        }
        if (Math.abs(value.y) > .1) {
            this.controllers.controllerObservable.notifyObservers({
                type: ControllerEventType.FORWARD_BACK,
                value: value.y * this.speedFactor
            });
            Base.stickVector.y = 1;
        } else {
            Base.stickVector.y = 0;
        }

        if (Base.stickVector.equals(Vector3.Zero())) {
            this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.LEFT_RIGHT, value: 0});
            this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.FORWARD_BACK, value: 0});
        } else {

        }
    }
}
import {Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {AbstractController} from "./abstractController";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {ControllerEventType} from "./types/controllerEventType";
import {controllerObservable, movable} from "./controllers";


export class LeftController extends AbstractController {
    private leftLogger = log.getLogger('Left');
    constructor(controller:
                    WebXRInputSource, xr: WebXRDefaultExperience, diagramManager: DiagramManager) {
        super(controller, xr, diagramManager);
        this.xrInputSource.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    this.leftLogger.trace(`thumbstick moved ${value.x}, ${value.y}`);
                    if (!movable) {
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
                        controllerObservable.notifyObservers({
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
                    controllerObservable.notifyObservers({
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
                    controllerObservable.notifyObservers({
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
                    controllerObservable.notifyObservers({
                        type: ControllerEventType.Y_BUTTON,
                        value: button.value
                    });
                }
            });
        }
    }

    private moveMovable(value: { x: number, y: number }) {
        if (Math.abs(value.x) > .1) {
            movable.position.x += .005 * Math.sign(value.x);
        } else {

        }
        if (Math.abs(value.y) > .1) {
            movable.position.y += -.005 * Math.sign(value.y);
        } else {

        }
    }

    private moveRig(value: { x: number, y: number }) {
        AbstractController.stickVector.x = this.notifyObserver(value.x, ControllerEventType.LEFT_RIGHT);
        AbstractController.stickVector.y = this.notifyObserver(value.y, ControllerEventType.FORWARD_BACK);
        if (AbstractController.stickVector.equals(Vector3.Zero())) {
            controllerObservable.notifyObservers({type: ControllerEventType.LEFT_RIGHT, value: 0});
            controllerObservable.notifyObservers({type: ControllerEventType.FORWARD_BACK, value: 0});
        }
    }
}

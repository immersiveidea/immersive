import {Base} from "./base";
import {Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {ControllerEventType} from "./controllers";

import {DiagramManager} from "../diagram/diagramManager";
import log from "loglevel";


export class Right extends Base {
    private rightLogger = log.getLogger("Right");
    private initBButton(bbutton: WebXRControllerComponent) {
        if (bbutton) {
            bbutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    this.rightLogger.debug('B Button Pressed');
                    this.controllers.controllerObservable.notifyObservers({
                        type: ControllerEventType.B_BUTTON,
                        value: button.value
                    });
                }
            });
        }
    }
    constructor(controller: WebXRInputSource,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager

    ) {
        super(controller, xr, diagramManager);
        this.xrInputSource.onMotionControllerInitObservable.add((init) => {
            this.initTrigger(init.components['xr-standard-trigger']);
            this.initBButton(init.components['b-button']);
            this.initAButton(init.components['a-button']);
            this.initThumbstick(init.components['xr-standard-thumbstick']);
        });
    }

    private initTrigger(trigger: WebXRControllerComponent) {
        if (trigger) {
            trigger
                .onButtonStateChangedObservable
                .add((button) => {
                    this.rightLogger.debug("right trigger pressed");
                    this.controllers.controllerObservable.notifyObservers({
                        type: ControllerEventType.TRIGGER,
                        value: button.value,
                        controller: this.xrInputSource
                    });
                }, -1, false, this);
        }
    }

    private initAButton(abutton: WebXRControllerComponent) {
        if (abutton) {
            abutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    this.rightLogger.debug('A button pressed');
                    this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.MENU});
                }
            });
        }
    }

    private initThumbstick(thumbstick: WebXRControllerComponent) {
        if (thumbstick) {
            thumbstick.onAxisValueChangedObservable.add((value) => {
                this.rightLogger.trace(`thumbstick moved ${value.x}, ${value.y}`);
                this.moveRig(value);
            });
            thumbstick.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    this.rightLogger.trace('Right', `thumbstick changed ${value.value}`);
                    this.controllers.controllerObservable.notifyObservers({
                        type: ControllerEventType.INCREASE_VELOCITY,
                        value: value.value
                    });
                }
            });
        }
    }

    private moveRig(value) {
        if (Math.abs(value.x) > .1) {
            this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.TURN, value: value.x});
        } else {
            this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.TURN, value: 0});
        }
        if (Math.abs(value.y) > .1) {
            this.controllers.controllerObservable.notifyObservers({
                type: ControllerEventType.UP_DOWN,
                value: value.y * this.speedFactor
            });
            Base.stickVector.z = 1;
        } else {
            this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.UP_DOWN, value: 0});
            Base.stickVector.z = 0;
        }
        if (Base.stickVector.equals(Vector3.Zero())) {
            this.controllers.controllerObservable.notifyObservers({type: ControllerEventType.UP_DOWN, value: 0});
        }
    }
}
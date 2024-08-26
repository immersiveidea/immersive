import {AbstractController} from "./abstractController";
import {Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";


import {DiagramManager} from "../diagram/diagramManager";
import log from "loglevel";
import {ControllerEventType} from "./types/controllerEventType";
import {controllerObservable} from "./controllers";


export class RightController extends AbstractController {
    private rightLogger = log.getLogger("Right");

    constructor(controller: WebXRInputSource,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager

    ) {
        super(controller, xr, diagramManager);
        this.xrInputSource.onMotionControllerInitObservable.add((init) => {
            this.initTrigger(init.components['xr-standard-trigger']);
            this.initButton(init.components['b-button'], ControllerEventType.B_BUTTON);
            this.initButton(init.components['a-button'], ControllerEventType.MENU);
            this.initThumbstick(init.components['xr-standard-thumbstick']);
        });
    }

    private initTrigger(trigger: WebXRControllerComponent) {
        if (trigger) {
            trigger
                .onButtonStateChangedObservable
                .add((button) => {
                    this.rightLogger.debug("right trigger pressed");
                    controllerObservable.notifyObservers({
                        type: ControllerEventType.TRIGGER,
                        value: button.value,
                        controller: this.xrInputSource
                    });
                }, -1, false, this);
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
                    controllerObservable.notifyObservers({
                        type: ControllerEventType.INCREASE_VELOCITY,
                        value: value.value
                    });
                }
            });
        }
    }

    private moveRig(value) {
        if (Math.abs(value.x) > .1) {
            controllerObservable.notifyObservers({type: ControllerEventType.TURN, value: value.x});
        } else {
            controllerObservable.notifyObservers({type: ControllerEventType.TURN, value: 0});
        }
        AbstractController.stickVector.z = this.notifyObserver(value.y, ControllerEventType.UP_DOWN);

        if (AbstractController.stickVector.equals(Vector3.Zero())) {
            controllerObservable.notifyObservers({type: ControllerEventType.UP_DOWN, value: 0});
        }
    }
}
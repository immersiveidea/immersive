import {Base} from "./base";
import {Scene, Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {Controllers} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";

export class Right extends Base {
    constructor(controller:
                    WebXRInputSource, scene: Scene, xr: WebXRDefaultExperience, diagramManager: DiagramManager, controllers: Controllers,
    ) {
        super(controller, scene, xr, controllers, diagramManager);
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
                    this.controllers.controllerObserver.notifyObservers({type: 'b-button', value: button.value});
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
                        this.controllers.controllerObserver.notifyObservers({type: 'trigger', value: button.value});
                    }
                });
        }
    }

    private initAButton(abutton: WebXRControllerComponent) {
        if (abutton) {
            abutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    log.getLogger("right").debug("a-button pressed");
                    this.controllers.controllerObserver.notifyObservers({type: 'menu'});
                }
            });
        }
    }

    private initThumbstick(thumbstick: WebXRControllerComponent) {
        if (thumbstick) {
            thumbstick.onAxisValueChangedObservable.add((value) => {
                log.trace('Right', `thumbstick moved ${value.x}, ${value.y}`);
                this.moveRig(value);
            });
            thumbstick.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    log.trace('Right', `thumbstick changed ${value.value}`);
                    this.controllers.controllerObserver.notifyObservers({type: 'increaseVelocity', value: value.value});
                }
            });
        }
    }

    private moveRig(value) {
        if (Math.abs(value.x) > .1) {
            this.controllers.controllerObserver.notifyObservers({type: 'turn', value: value.x});
        } else {
            this.controllers.controllerObserver.notifyObservers({type: 'turn', value: 0});
        }
        if (Math.abs(value.y) > .1) {
            this.controllers.controllerObserver.notifyObservers({type: 'updown', value: value.y * this.speedFactor});
            Base.stickVector.z = 1;
        } else {
            this.controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
            Base.stickVector.z = 0;
        }
        if (Base.stickVector.equals(Vector3.Zero())) {
            this.controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
        }
    }
}
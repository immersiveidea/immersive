import {Base} from "./base";
import {Scene, Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {ControllerEventType, Controllers} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramListingMenu} from "../menus/diagramListingMenu";

export class Right extends Base {
    private listingMenu: DiagramListingMenu;

    private startPosition: Vector3 = null;

    private initBButton(bbutton: WebXRControllerComponent) {
        if (bbutton) {
            bbutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    this.controllers.controllerObserver.notifyObservers({
                        type: ControllerEventType.B_BUTTON,
                        value: button.value
                    });
                }
            });
        }
    }
    private startTime: number = null;
    private endPosition: Vector3 = null;

    constructor(controller: WebXRInputSource,
                scene: Scene,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager,
                controllers: Controllers,
    ) {
        super(controller, scene, xr, controllers, diagramManager);
        this.listingMenu = new DiagramListingMenu(this.scene, xr, this.controllers);
        this.controller.onMotionControllerInitObservable.add((init) => {
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
                    if (button.pressed) {
                        this.controllers.controllerObserver.notifyObservers({
                            type: ControllerEventType.TRIGGER,
                            value: button.value
                        });
                        if (!this.startTime) {
                            this.startTime = new Date().getTime();
                            this.startPosition = this.controller.pointer.absolutePosition.clone();
                        }

                    } else {
                        this.endPosition = this.controller.pointer.absolutePosition.clone();
                        if (this.startTime && this.startPosition) {
                            const duration = new Date().getTime() - this.startTime;

                            this.controllers.controllerObserver.notifyObservers({
                                type: ControllerEventType.MOTION,
                                startPosition: this.startPosition,
                                endPosition: this.endPosition,
                                duration: duration
                            });
                            this.startTime = null;
                            this.startPosition = null;
                        }

                    }
                }, -1, false, this);
        }
    }

    private initAButton(abutton: WebXRControllerComponent) {
        if (abutton) {
            abutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    log.getLogger("right").debug("a-button pressed");
                    this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.MENU});
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
                    this.controllers.controllerObserver.notifyObservers({
                        type: ControllerEventType.INCREASE_VELOCITY,
                        value: value.value
                    });
                }
            });
        }
    }

    private moveRig(value) {
        if (Math.abs(value.x) > .1) {
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.TURN, value: value.x});
        } else {
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.TURN, value: 0});
        }
        if (Math.abs(value.y) > .1) {
            this.controllers.controllerObserver.notifyObservers({
                type: ControllerEventType.UP_DOWN,
                value: value.y * this.speedFactor
            });
            Base.stickVector.z = 1;
        } else {
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.UP_DOWN, value: 0});
            Base.stickVector.z = 0;
        }
        if (Base.stickVector.equals(Vector3.Zero())) {
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.UP_DOWN, value: 0});
        }
    }
}
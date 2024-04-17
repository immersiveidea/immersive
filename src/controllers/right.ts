import {Base} from "./base";
import {
    TransformNode,
    Vector2,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {ControllerEventType} from "./controllers";

import {DiagramManager} from "../diagram/diagramManager";
import {RoundButton} from "../objects/roundButton";
import log from "loglevel";
import {DefaultScene} from "../defaultScene";

const logger = log.getLogger("Right");
export class Right extends Base {

    private startPosition: Vector3 = null;

    private initBButton(bbutton: WebXRControllerComponent) {
        if (bbutton) {
            bbutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    logger.debug('B Button Pressed');
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
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager

    ) {
        super(controller, xr, diagramManager);
        const scene = DefaultScene.Scene;

        this.controller.onMotionControllerInitObservable.add((init) => {
            this.initTrigger(init.components['xr-standard-trigger']);
            if (init.components['a-button']) {
                const transform = new TransformNode('a-button', scene);
                transform.parent = controller.grip;
                transform.rotation.x = Math.PI / 2;
                transform.scaling = new Vector3(.2, .2, .2);
                const abutton = new RoundButton(transform, 'A', 'toggle edit menu', new Vector2(.5, -.1));
                const bbutton = new RoundButton(transform, 'B', 'toggle diagram selector', new Vector2(.4, .1));

            }
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
                    logger.debug("right trigger pressed");
                    this.controllers.controllerObserver.notifyObservers({
                        type: ControllerEventType.TRIGGER,
                        value: button.value,
                        controller: this.controller
                    });
                }, -1, false, this);
        }
    }

    private initAButton(abutton: WebXRControllerComponent) {
        if (abutton) {
            abutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    logger.debug('A button pressed');
                    this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.MENU});
                }
            });
        }
    }

    private initThumbstick(thumbstick: WebXRControllerComponent) {
        if (thumbstick) {
            thumbstick.onAxisValueChangedObservable.add((value) => {
                logger.trace(`thumbstick moved ${value.x}, ${value.y}`);
                this.moveRig(value);
            });
            thumbstick.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    logger.trace('Right', `thumbstick changed ${value.value}`);
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
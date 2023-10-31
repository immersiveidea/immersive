import {Base} from "./base";
import {
    Scene,
    TransformNode,
    Vector2,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {ControllerEventType, Controllers} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramListingMenu} from "../menus/diagramListingMenu";
import {Button} from "../objects/button";

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
            if (init.components['a-button']) {
                const transform = new TransformNode('a-button', scene);
                transform.parent = controller.grip;
                transform.rotation.x = Math.PI / 2;
                transform.scaling = new Vector3(.2, .2, .2);
                const abutton = new Button(transform, 'A', 'toggle edit menu', new Vector2(.5, -.1));
                const bbutton = new Button(transform, 'B', 'toggle diagram selector', new Vector2(.4, .1));

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
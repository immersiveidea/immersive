import {
    Scene,
    TransformNode,
    Vector2,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {Base} from "./base";
import {ControllerEventType, Controllers} from "./controllers";
import log from "loglevel";
import {ConfigMenu} from "../menus/configMenu";
import {DiagramManager} from "../diagram/diagramManager";
import {RoundButton} from "../objects/roundButton";


export class Left extends Base {
    public configMenu: ConfigMenu;

    constructor(controller:
                    WebXRInputSource, scene: Scene, xr: WebXRDefaultExperience, diagramManager: DiagramManager, controllers: Controllers) {

        super(controller, scene, xr, controllers, diagramManager);
        this.configMenu = new ConfigMenu(this.scene, xr, this.controllers, this.diagramManager.config);
        this.controller.onMotionControllerInitObservable.add((init) => {
            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    log.trace('Left', `thumbstick moved ${value.x}, ${value.y}`);
                    if (!this.controllers.movable) {
                        this.moveRig(value);
                    } else {
                        this.moveMovable(value);
                    }
                });
                if (init.components['x-button']) {
                    const transform = new TransformNode('x-button', scene);
                    transform.parent = controller.grip;
                    transform.rotation.x = Math.PI / 2;
                    transform.scaling = new Vector3(.2, .2, .2);
                    const xbutton = new RoundButton(transform, 'X', 'toggle toolbox menu', new Vector2(-.5, -.1));
                    const ybutton = new RoundButton(transform, 'Y', 'toggle settings menu', new Vector2(-.4, .1));

                }
                this.initXButton(init.components['x-button']);
                this.initYButton(init.components['y-button']);
                const buttonhome = new TransformNode('buttons', scene)

                //const xbutton = new Button(buttonhome, 'X', 'open edit menu', new Vector2(0,0));
                //const ybutton = new Button(buttonhome, 'Y', 'open edit menu', new Vector2(.4,0));

                this.initTrigger(init.components['xr-standard-trigger']);
                init.components['xr-standard-thumbstick'].onButtonStateChangedObservable.add((value) => {
                    if (value.pressed) {
                        log.trace('Left', 'thumbstick changed');
                        this.controllers.controllerObserver.notifyObservers({
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
                    this.controllers.controllerObserver.notifyObservers({
                        type: ControllerEventType.TRIGGER,
                        value: button.value,
                        controller: this.controller
                    });
                }, -1, false, this);
        }
    }

    private initXButton(xbutton: WebXRControllerComponent) {
        if (xbutton) {

            xbutton.onButtonStateChangedObservable.add((button) => {
                if (button.pressed) {
                    this.controllers.controllerObserver.notifyObservers({
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
                    this.controllers.controllerObserver.notifyObservers({
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
            this.controllers.controllerObserver.notifyObservers({
                type: ControllerEventType.LEFT_RIGHT,
                value: value.x * this.speedFactor
            });
            Base.stickVector.x = 1;
        } else {
            Base.stickVector.x = 0;
        }
        if (Math.abs(value.y) > .1) {
            this.controllers.controllerObserver.notifyObservers({
                type: ControllerEventType.FORWARD_BACK,
                value: value.y * this.speedFactor
            });
            Base.stickVector.y = 1;
        } else {
            Base.stickVector.y = 0;
        }

        if (Base.stickVector.equals(Vector3.Zero())) {
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.LEFT_RIGHT, value: 0});
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.FORWARD_BACK, value: 0});
        } else {

        }
    }
}
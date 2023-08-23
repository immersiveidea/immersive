import {Scene, Vector3, WebXRControllerComponent, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {Base} from "./base";
import {ControllerEventType, Controllers} from "./controllers";
import log from "loglevel";
import {ConfigMenu} from "../menus/configMenu";
import {DiagramManager} from "../diagram/diagramManager";


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
                this.initXButton(init.components['x-button']);
                this.initYButton(init.components['y-button']);
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
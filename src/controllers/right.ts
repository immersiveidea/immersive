import {Base} from "./base";
import {Angle, Scene, Vector3, WebXRControllerComponent, WebXRInputSource} from "@babylonjs/core";
import {Bmenu} from "../menus/bmenu";
import {DiagramManager} from "../diagram/diagramManager";
import {ControllerMovementMode, Controllers} from "./controllers";
import {BmenuState} from "../menus/MenuState";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";

export class Right extends Base {
    private bmenu: Bmenu;
    public static instance: Right;

    private down: boolean = false;

    constructor(controller:
                    WebXRInputSource, scene: Scene) {
        super(controller, scene);
        Right.instance = this;
        this.controller.onMotionControllerInitObservable.add((init) => {
            this.initTrigger(init.components['xr-standard-trigger']);
            this.initBButton(init.components['b-button']);
            this.initAButton(init.components['a-button']);
            this.initThumbstick(init.components['xr-standard-thumbstick']);


        });
    }
    private initBButton(bbutton: WebXRControllerComponent) {
        if (bbutton) {
            bbutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    this.bmenu.toggle(this.controller.grip);
                }
            });
        }
    }

    private initTrigger(trigger: WebXRControllerComponent) {
        if (trigger) {
            trigger
                .onButtonStateChangedObservable
                .add((value) => {
                    if (value.value > .4 && !this.down) {
                        this.down = true;
                        if (this.bmenu.getState() == BmenuState.ADDING) {
                            this.bmenu.setState(BmenuState.DROPPING);
                            const event: DiagramEvent = {
                                type: DiagramEventType.DROP,
                                entity: null
                            }
                            DiagramManager.onDiagramEventObservable.notifyObservers(event);
                        }
                    }
                    if (value.value < .05) {
                        this.down = false;
                    }
                });
        }
    }

    private initAButton(abutton: WebXRControllerComponent) {
        if (abutton) {
            abutton.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    if (DiagramManager.currentMesh) {
                        if (Controllers.movable) {
                            Controllers.movable = null;
                        } else {
                            Controllers.movable = DiagramManager.currentMesh;
                        }

                    }
                }
            });
        }
    }

    private initThumbstick(thumbstick: WebXRControllerComponent) {
        if (thumbstick) {
            thumbstick.onAxisValueChangedObservable.add((value) => {
                if (!Controllers.movable) {
                    this.moveRig(value);
                } else {
                    if (Controllers.movementMode == ControllerMovementMode.ROTATE) {
                        this.rotateMovable(value);
                    } else {
                        this.moveMovable(value);
                    }
                }
            });
            thumbstick.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    Controllers.toggleMovementMode();
                }
            });
        }
    }

    private moveRig(value) {
        if (Math.abs(value.x) > .1) {
            Controllers.controllerObserver.notifyObservers({type: 'turn', value: value.x});
        } else {
            Controllers.controllerObserver.notifyObservers({type: 'turn', value: 0});
        }
        if (Math.abs(value.y) > .1) {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: value.y * this.speedFactor});
            Base.stickVector.z = 1;
        } else {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
            Base.stickVector.z = 0;
        }
        if (Base.stickVector.equals(Vector3.Zero())) {
            Controllers.controllerObserver.notifyObservers({type: 'updown', value: 0});
        }
    }



    public setBMenu(menu: Bmenu) {
        this.bmenu = menu;
        this.bmenu.setController(this.controller);
    }

    private rotateMovable(value: { x: number; y: number }) {
        if (Math.abs(value.y) > .1) {
            Controllers.movable.rotation.x +=
                Angle.FromDegrees(Math.sign(value.y)).radians();
            Controllers.movable.rotation.x = this.fixRadians(Controllers.movable.rotation.x);
        }
        if (Math.abs(value.x) > .1) {
            Controllers.movable.rotation.z +=
                Angle.FromDegrees(Math.sign(value.x)).radians();
            Controllers.movable.rotation.z = this.fixRadians(Controllers.movable.rotation.z);
        }
    }
    private fixRadians(value: number) {
        if (value > 2 * Math.PI) {
            return value - 2 * Math.PI;
        } else {
            return value;
        }
    }
    private moveMovable(value: { x: number; y: number }) {
        if (Math.abs(value.y) > .1) {
            Controllers.movable.position.z += Math.sign(value.y) * -.005;
        }
        if (Math.abs(value.x) > .1) {
            Controllers.movable.position.x += Math.sign(value.x) * .005;
        }
    }
}
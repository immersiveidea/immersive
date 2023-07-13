import {Base} from "./base";
import {Vector3, WebXRInputSource} from "@babylonjs/core";
import {Bmenu, BmenuState} from "../menus/bmenu";
import {DiagramEvent, DiagramEventType, DiagramManager} from "../diagram/diagramManager";

export class Right extends Base {
    private bmenu: Bmenu;
    private down: boolean = false;

    constructor(controller:
                    WebXRInputSource) {
        super(controller);
        this.controller.onMotionControllerInitObservable.add((init)=> {
            const trigger = init.components['xr-standard-trigger'];
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
            if (init.components['b-button']) {
                init.components['b-button'].onButtonStateChangedObservable.add((value)=>{
                   if (value.pressed) {
                        this.bmenu.toggle();
                   }
                });
            }

            if (init.components['xr-standard-thumbstick']) {
                init.components['xr-standard-thumbstick']
                    .onAxisValueChangedObservable.add((value) => {
                    if (Math.abs(value.x) > .1) {
                        this.rig.turn(value.x);
                    } else {
                        this.rig.turn(0);
                    }

                    if (Math.abs(value.y) > .1) {
                        this.rig.forwardback(value.y*this.speedFactor);
                        Base.stickVector.z = 1;
                    } else {
                        Base.stickVector.z = 0;
                    }
                    if (Base.stickVector.equals(Vector3.Zero())) {
                        this.rig.forwardback(0);
                    }
                });
            }
        });
    }

    public setBMenu(menu: Bmenu) {
        this.bmenu = menu;
        this.bmenu.setController(this.controller);
    }

}
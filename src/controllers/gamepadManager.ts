import {DualShockPad, Scene} from "@babylonjs/core";
import {DualshockEventMapper} from "../util/dualshockEventMapper";
import log from "loglevel";

export class GamepadManager {
    constructor(scene: Scene) {
        scene.gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
            try {
                const dualshock = (gamepad as DualShockPad);
                dualshock.onButtonDownObservable.add((button: any) => {
                    const buttonEvent = DualshockEventMapper.mapButtonEvent(button, 1);
                    if (buttonEvent.objectName) {
                        window.dispatchEvent(new CustomEvent('pa-button-state-change', {
                                detail: buttonEvent
                            }
                        ));
                    }
                });
                dualshock.onButtonUpObservable.add((button: any) => {
                    const buttonEvent = DualshockEventMapper.mapButtonEvent(button, 0);
                    if (buttonEvent.objectName) {
                        window.dispatchEvent(new CustomEvent('pa-button-state-change', {
                                detail: buttonEvent
                            }
                        ));
                    }
                });

                gamepad.onleftstickchanged((values) => {
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "left-controller",
                                value: values.x,
                                axisIndex: 0
                            }
                        }));
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "left-controller",
                                value: values.y,
                                axisIndex: 1
                            }
                        }));
                });
                gamepad.onrightstickchanged((values) => {
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "right-controller",
                                value: values.x,
                                axisIndex: 0
                            }
                        }));
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "right-controller",
                                value: values.y,
                                axisIndex: 1
                            }
                        }));
                });
            } catch (err) {
                log.warn('App', err);
            }
        });
    }
}
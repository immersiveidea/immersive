import {DualShockButton} from "@babylonjs/core";
import log from "loglevel";
type ButtonEvent = {
    objectName?: string,
    pressed: boolean,
    touched: boolean,
    value: number,
    buttonIndex?: number
}
export class DualshockEventMapper {
    public static mapButtonEvent(buttonid: any, value: number):  ButtonEvent {
        const buttonEvent = {
            objectName: null,
            pressed: value == 1,
            touched: false,
            value: value,
            buttonIndex: null
        };
        switch (buttonid) {
            case DualShockButton.Circle:
                log.debug('DualshockEventMapper','circle');
                break;
            case DualShockButton.Cross:
                log.debug('DualshockEventMapper','cross');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 3;
                break;
            case DualShockButton.Triangle:
                log.debug('DualshockEventMapper','triangle');
                break;
            case DualShockButton.Square:
                log.debug('DualshockEventMapper','square');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 4;
                break;
            case DualShockButton.L1:
                log.debug('DualshockEventMapper','L1');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 2;
                break;
            case DualShockButton.R1:
                log.debug('DualshockEventMapper','R1');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 2;
                break;
            case 6:
                log.debug('DualshockEventMapper','L2');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 1;
                break;
            case 7:
                log.debug('DualshockEventMapper','R2');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 1;
                break;
            case 12:
                log.debug('DualshockEventMapper','D-Pad Up');
                break;
            case 13:
                log.debug('DualshockEventMapper','D-Pad Down');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 3;
                break;
            case 14:
                log.debug('DualshockEventMapper','D-Pad Left');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 4;
                break;
            case 15:
                log.debug('DualshockEventMapper','D-Pad Right');
                break;
            case 10:
                log.debug('DualshockEventMapper','L3');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 0;
                break;
            case 11:
                log.debug('DualshockEventMapper','R3');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 0;
                break;
            default:
                log.debug('DualshockEventMapper',buttonid);

        }
        return buttonEvent;
    }
}
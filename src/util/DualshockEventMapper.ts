import {DualShockButton} from "@babylonjs/core";
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
                console.log('circle');
                break;
            case DualShockButton.Cross:
                console.log('cross');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 3;
                break;
            case DualShockButton.Triangle:
                console.log('triangle');
                break;
            case DualShockButton.Square:
                console.log('square');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 4;
                break;
            case DualShockButton.L1:
                console.log('L1');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 2;
                break;
            case DualShockButton.R1:
                console.log('R1');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 2;
                break;
            case 6:
                console.log('L2');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 1;
                break;
            case 7:
                console.log('R2');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 1;
                break;
            case 12:
                console.log('D-Pad Up');
                break;
            case 13:
                console.log('D-Pad Down');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 3;
                break;
            case 14:
                console.log('D-Pad Left');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 4;
                break;
            case 15:
                console.log('D-Pad Right');
                break;
            case 10:
                console.log('L3');
                buttonEvent.objectName = "left-controller";
                buttonEvent.buttonIndex = 0;
                break;
            case 11:
                console.log('R3');
                buttonEvent.objectName = "right-controller";
                buttonEvent.buttonIndex = 0;
                break;
            default:
                console.log(buttonid);

        }
        return buttonEvent;
    }
}
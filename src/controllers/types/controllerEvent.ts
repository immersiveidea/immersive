import {Vector3, WebXRInputSource} from "@babylonjs/core";
import {ControllerEventType} from "./controllerEventType";

export type ControllerEvent = {
    type: ControllerEventType,
    value?: number,
    startPosition?: Vector3,
    endPosition?: Vector3,
    duration?: number,
    gripId?: string;
    controller?: WebXRInputSource;
}

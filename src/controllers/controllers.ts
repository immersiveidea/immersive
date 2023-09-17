import {AbstractMesh, Observable, TransformNode, Vector3} from "@babylonjs/core";

export type ControllerEvent = {
    type: ControllerEventType,
    value?: number,
    startPosition?: Vector3,
    endPosition?: Vector3,
    duration?: number,
    gripId?: string;
}

export enum ControllerEventType {
    GRIP = 'grip',
    HIDE = 'hide',
    SHOW = 'show',
    PULSE = 'pulse',
    SQUEEZE = 'squeeze',
    Y_BUTTON = 'y-button',
    X_BUTTON = 'x-button',
    A_BUTTON = 'a-button',
    B_BUTTON = 'b-button',
    THUMBSTICK = 'thumbstick',
    THUMBSTICK_CHANGED = 'thumbstickChanged',
    DECREASE_VELOCITY = 'decreaseVelocity',
    INCREASE_VELOCITY = 'decreaseVelocity',
    LEFT_RIGHT = 'leftright',
    FORWARD_BACK = 'forwardback',
    TURN = 'turn',
    UP_DOWN = 'updown',
    TRIGGER = 'trigger',
    MENU = 'menu',
    MOTION = 'motion'
}

export class Controllers {
    public movable: TransformNode | AbstractMesh;
    public readonly controllerObserver: Observable<ControllerEvent> = new Observable();
}
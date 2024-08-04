import {ActionEvent} from "@babylonjs/core";

const POINTER_UP = "pointerup";

export function isUp(event: ActionEvent): boolean {
    return event?.sourceEvent?.type == POINTER_UP;
}
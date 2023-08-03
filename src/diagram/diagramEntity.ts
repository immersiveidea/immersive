import {Color3, Vector3} from "@babylonjs/core";
import {EditMenuState} from "../menus/MenuState";

export enum DiagramEventType {
    ADD,
    REMOVE,
    MODIFY,
    DROP,
    DROPPED,
    CLEAR,
    CHANGECOLOR,
    COPY
}


export type DiagramEvent = {
    type: DiagramEventType;
    menustate?: EditMenuState;
    entity?: DiagramEntity;
    oldColor?: Color3;
    newColor?: Color3;

}
export type DiagramEntity = {
    color?: string;
    id?: string;
    last_seen?: Date;
    position?: Vector3;
    rotation?: Vector3;
    template?: string;
    text?: string;
    scale?: Vector3;
    parent?: string;
}



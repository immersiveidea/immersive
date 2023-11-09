import {Color3} from "@babylonjs/core";
import {EditMenuState} from "../../menus/editMenuState";

export enum DiagramEventType {
    ADD,
    REMOVE,
    MODIFY,
    DROP,
    DROPPED,
    CLEAR,
    CHANGECOLOR,
    SYNC
}

export enum DiagramEventMask {
    LOCAL = 1,
    REMOTE = 2,
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
    from?: string;
    to?: string;
    last_seen?: Date;
    position?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number };
    template?: string;
    text?: string;
    scale?: { x: number, y: number, z: number };
    parent?: string;
    diagramlistingid?: string;
}
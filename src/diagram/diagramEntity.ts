import {Vector3} from "@babylonjs/core";
import {BmenuState} from "../menus/MenuState";
export enum DiagramEventType {
    ADD,
    REMOVE,
    MODIFY,
    DROP,
    DROPPED,
    CLEAR,


}
export type DiagramEvent = {
    type: DiagramEventType;
    menustate?: BmenuState;
    entity?: DiagramEntity;

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



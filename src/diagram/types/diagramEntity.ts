import {Color3} from "@babylonjs/core";

export enum DiagramEventType {
    ADD,
    REMOVE,
    MODIFY,
    DROP,
    DROPPED,
    CLEAR,
    CHANGECOLOR,
    SYNC,
    RESET
}

export enum DiagramEntityType {
    USER = "user"
}

export enum DiagramEventMask {
    LOCAL = 1,
    REMOTE = 2,
}

export enum DiagramTemplates {
    CONNECTION = "#connection-template",
    USER = "#user-template",
    BOX = "#box-template",
    SPHERE = "#sphere-template",
    CYLINDER = "#cylinder-template",
    CONE = "#cone-template",
    IMAGE = "#image-template",
    PLANE = "#plane-template",
    PERSON = "#person-template"
}

export type DiagramEvent = {
    type: DiagramEventType;
    entity?: DiagramEntity;
    oldColor?: Color3;
    newColor?: Color3;

}
export type DiagramEntity = {
    color?: string;
    id?: string;
    from?: string;
    to?: string;
    image?: string;
    last_seen?: Date;
    position?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number };
    template?: string;
    type: 'entity'
    text?: string;
    scale?: { x: number, y: number, z: number };
    parent?: string;
    diagramlistingid?: string;
    friendly?: string;
    rightHand?: {
        position: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number }
    },
    leftHand?: {
        position: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number }
    },
    head?: {
        position: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number }
    }
}
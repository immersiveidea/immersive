import {Quaternion, Vector3} from "@babylonjs/core";

export type LabelRenderingMode = 'fixed' | 'billboard' | 'dynamic' | 'distance';

export type MenuConfig = {
    position: Vector3,
    quarternion: Quaternion,
    scale: Vector3
}
export type AppConfigType = {
    id?: number,
    currentDiagramId?: string,
    locationSnap?: number,
    rotateSnap?: number,
    createSnap?: number,
    turnSnap?: number,
    physicsEnabled?: boolean,
    newRelicKey?: string,
    newRelicAccount?: string,
    passphrase?: string,
    flyMode?: boolean,
    labelRenderingMode?: LabelRenderingMode,
    toolbox?: MenuConfig,
    configMenu?: MenuConfig,
    keyboard?: MenuConfig
}
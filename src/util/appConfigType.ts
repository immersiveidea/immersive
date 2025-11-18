export type LabelRenderingMode = 'fixed' | 'billboard' | 'dynamic' | 'distance';

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

}
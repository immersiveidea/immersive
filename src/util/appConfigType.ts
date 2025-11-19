export type LabelRenderingMode = 'fixed' | 'billboard' | 'dynamic' | 'distance';

/**
 * Serializable 3D vector with x, y, z components
 * Used instead of BabylonJS Vector3 for JSON storage
 */
export type Vec3 = {
    x: number,
    y: number,
    z: number
}

/**
 * Configuration for a handle's position, rotation, and optional scale
 */
export type HandleConfig = {
    /** Unique identifier for the handle (e.g., "handle-toolbox") */
    id: string,
    /** Display label for the handle (e.g., "Toolbox") */
    label: string,
    /** Position in platform local space */
    position: Vec3,
    /** Rotation in Euler angles */
    rotation: Vec3,
    /** Optional scale (can be undefined for handles that don't need it) */
    scale?: Vec3
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
    handles?: HandleConfig[],

}
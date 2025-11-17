/**
 * Handle types for the resize gizmo
 */
export enum HandleType {
    FACE_POS_X = 'face_pos_x',
    FACE_NEG_X = 'face_neg_x',
    FACE_POS_Y = 'face_pos_y',
    FACE_NEG_Y = 'face_neg_y',
    FACE_POS_Z = 'face_pos_z',
    FACE_NEG_Z = 'face_neg_z',
    CORNER_PPP = 'corner_ppp', // (+X, +Y, +Z)
    CORNER_PPN = 'corner_ppn', // (+X, +Y, -Z)
    CORNER_PNP = 'corner_pnp', // (+X, -Y, +Z)
    CORNER_PNN = 'corner_pnn', // (+X, -Y, -Z)
    CORNER_NPP = 'corner_npp', // (-X, +Y, +Z)
    CORNER_NPN = 'corner_npn', // (-X, +Y, -Z)
    CORNER_NNP = 'corner_nnp', // (-X, -Y, +Z)
    CORNER_NNN = 'corner_nnn', // (-X, -Y, -Z)
}
/**
 * Handle state for visual feedback
 */
export enum HandleState {
    NORMAL = 'normal',
    HOVER = 'hover',
    ACTIVE = 'active',
    IDLE = 'idle'
}

/**
 * Handle position definition with name and normalized coordinates
 */
export interface HandlePositionDef {
    name: string;
    position: { x: number; y: number; z: number };
    description: string;
}

/**
 * Corner handle positions as static constants
 * Index corresponds to BabylonJS boundingBox.vectorsWorld array
 * Normalized coordinates are -1 or +1 on each axis (unit cube corners)
 */
export const CORNER_POSITIONS: readonly HandlePositionDef[] = [
    {
        name: 'CORNER_NNN',
        position: { x: -1, y: -1, z: -1 },
        description: 'Bottom-back-left (-X, -Y, -Z)'
    },
    {
        name: 'CORNER_PNN',
        position: { x: +1, y: -1, z: -1 },
        description: 'Bottom-back-right (+X, -Y, -Z)'
    },
    {
        name: 'CORNER_PNP',
        position: { x: +1, y: -1, z: +1 },
        description: 'Bottom-front-right (+X, -Y, +Z)'
    },
    {
        name: 'CORNER_NNP',
        position: { x: -1, y: -1, z: +1 },
        description: 'Bottom-front-left (-X, -Y, +Z)'
    },
    {
        name: 'CORNER_NPN',
        position: { x: -1, y: +1, z: -1 },
        description: 'Top-back-left (-X, +Y, -Z)'
    },
    {
        name: 'CORNER_PPN',
        position: { x: +1, y: +1, z: -1 },
        description: 'Top-back-right (+X, +Y, -Z)'
    },
    {
        name: 'CORNER_PPP',
        position: { x: +1, y: +1, z: +1 },
        description: 'Top-front-right (+X, +Y, +Z)'
    },
    {
        name: 'CORNER_NPP',
        position: { x: -1, y: +1, z: +1 },
        description: 'Top-front-left (-X, +Y, +Z)'
    },
] as const;

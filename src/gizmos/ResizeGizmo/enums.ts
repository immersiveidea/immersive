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
}

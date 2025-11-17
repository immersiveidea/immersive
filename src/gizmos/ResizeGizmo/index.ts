/**
 * ResizeGizmo Module
 *
 * A simple WebXR gizmo for resizing meshes with:
 * - 8 corner handles for uniform scaling
 * - Manual ray casting for utility layer interaction
 * - Normalized position vectors for handle placement
 */

export { ResizeGizmo } from './ResizeGizmo';
export type { ResizeGizmoEvent } from './types';
export type { HandlePositionDef } from './enums';
export { HandleType, HandleState, CORNER_POSITIONS, FACE_POSITIONS } from './enums';

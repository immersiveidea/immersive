/**
 * ResizeGizmo Module
 *
 * A simple WebXR gizmo for resizing meshes with:
 * - 6 face handles for single-axis scaling
 * - 8 corner handles for uniform scaling
 * - Manual ray casting for utility layer interaction
 * - Billboard scaling for constant screen-size handles
 */

export { ResizeGizmo } from './ResizeGizmo';
export type { ResizeGizmoEvent, HandleInfo } from './types';
export { HandleType, HandleState } from './enums';

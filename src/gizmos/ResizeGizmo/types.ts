import { AbstractMesh, Mesh, StandardMaterial, Vector3 } from '@babylonjs/core';
import { HandleType, HandleState } from './enums';

/**
 * Event emitted during and after scaling operations
 */
export interface ResizeGizmoEvent {
    mesh: AbstractMesh;
}

/**
 * Information about a handle
 */
export interface HandleInfo {
    mesh: Mesh;
    type: HandleType;
    state: HandleState;
    material: StandardMaterial;
    /** Local space offset from target center for positioning */
    localOffset: Vector3;
}

/**
 * WebXR Resize Gizmo - Snapping System
 * Handles snap-to-grid functionality for scale values
 */

import { Vector3 } from "@babylonjs/core";
import { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";

/**
 * Snapping utilities for resize gizmo
 */
export class ResizeGizmoSnapping {
    private _config: ResizeGizmoConfigManager;

    constructor(config: ResizeGizmoConfigManager) {
        this._config = config;
    }

    /**
     * Snap a single value to nearest snap interval
     */
    private snapValue(value: number, snapInterval: number): number {
        if (snapInterval <= 0) {
            return value;
        }

        return Math.round(value / snapInterval) * snapInterval;
    }

    /**
     * Snap a scale vector to configured snap intervals
     */
    snapScale(scale: Vector3): Vector3 {
        if (!this._config.current.enableSnapping) {
            return scale;
        }

        const config = this._config.current;

        return new Vector3(
            this.snapValue(scale.x, config.snapDistanceX),
            this.snapValue(scale.y, config.snapDistanceY),
            this.snapValue(scale.z, config.snapDistanceZ)
        );
    }

    /**
     * Snap only specific axes
     */
    snapScaleAxes(scale: Vector3, axes: ("X" | "Y" | "Z")[]): Vector3 {
        if (!this._config.current.enableSnapping) {
            return scale;
        }

        const result = scale.clone();
        const config = this._config.current;

        for (const axis of axes) {
            switch (axis) {
                case "X":
                    result.x = this.snapValue(result.x, config.snapDistanceX);
                    break;
                case "Y":
                    result.y = this.snapValue(result.y, config.snapDistanceY);
                    break;
                case "Z":
                    result.z = this.snapValue(result.z, config.snapDistanceZ);
                    break;
            }
        }

        return result;
    }

    /**
     * Check if a value is close to a snap point (for visual feedback)
     */
    isNearSnapPoint(value: number, snapInterval: number, threshold: number = 0.05): boolean {
        if (snapInterval <= 0) {
            return false;
        }

        const snapped = this.snapValue(value, snapInterval);
        return Math.abs(value - snapped) < threshold * snapInterval;
    }

    /**
     * Get nearest snap point for a value
     */
    getNearestSnapPoint(value: number, snapInterval: number): number {
        return this.snapValue(value, snapInterval);
    }

    /**
     * Get all snap points in a range
     */
    getSnapPointsInRange(min: number, max: number, snapInterval: number): number[] {
        if (snapInterval <= 0) {
            return [];
        }

        const points: number[] = [];
        const start = Math.ceil(min / snapInterval) * snapInterval;
        const end = Math.floor(max / snapInterval) * snapInterval;

        for (let value = start; value <= end; value += snapInterval) {
            points.push(value);
        }

        return points;
    }

    /**
     * Calculate haptic feedback intensity based on proximity to snap point
     * Returns 0-1 value (1 = directly on snap point, 0 = far from snap)
     */
    calculateSnapProximity(value: number, snapInterval: number): number {
        if (snapInterval <= 0) {
            return 0;
        }

        const snapped = this.snapValue(value, snapInterval);
        const distance = Math.abs(value - snapped);
        const maxDistance = snapInterval / 2;

        return Math.max(0, 1 - (distance / maxDistance));
    }

    /**
     * Check if snapping is enabled
     */
    isEnabled(): boolean {
        return this._config.current.enableSnapping;
    }
}

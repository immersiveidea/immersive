/**
 * WebXR Resize Gizmo - Scaling Calculations
 * Calculates new scale values based on handle type and drag motion
 */

import { Vector3, AbstractMesh } from "@babylonjs/core";
import { HandlePosition, HandleType } from "./types";
import { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";
import { ResizeGizmoSnapping } from "./ResizeGizmoSnapping";

/**
 * Handles all scaling calculations for different handle types
 */
export class ScalingCalculator {
    private _config: ResizeGizmoConfigManager;
    private _snapping: ResizeGizmoSnapping;

    constructor(config: ResizeGizmoConfigManager, snapping: ResizeGizmoSnapping) {
        this._config = config;
        this._snapping = snapping;
    }

    /**
     * Calculate new scale based on handle drag
     */
    calculateScale(
        mesh: AbstractMesh,
        handle: HandlePosition,
        startScale: Vector3,
        startPointerPosition: Vector3,
        currentPointerPosition: Vector3,
        boundingBoxCenter?: Vector3
    ): Vector3 {
        // Calculate drag vector (world space)
        const dragVector = currentPointerPosition.subtract(startPointerPosition);

        // Calculate scale based on handle type
        let newScale: Vector3;

        switch (handle.type) {
            case HandleType.CORNER:
                newScale = this.calculateUniformScale(mesh, handle, startScale, startPointerPosition, currentPointerPosition, boundingBoxCenter);
                break;
            case HandleType.EDGE:
                newScale = this.calculateTwoAxisScale(mesh, handle, startScale, startPointerPosition, currentPointerPosition, boundingBoxCenter);
                break;
            case HandleType.FACE:
                newScale = this.calculateSingleAxisScale(mesh, handle, startScale, startPointerPosition, currentPointerPosition, boundingBoxCenter);
                break;
        }

        // Apply snapping
        newScale = this._snapping.snapScaleAxes(newScale, handle.axes);

        // Apply constraints
        newScale = this.applyConstraints(newScale);

        return newScale;
    }

    /**
     * Calculate uniform scale (all axes together) using distance-ratio method
     * Uses "virtual stick" metaphor - scale based on distance from bounding box center
     */
    private calculateUniformScale(
        mesh: AbstractMesh,
        handle: HandlePosition,
        startScale: Vector3,
        startVirtualPoint: Vector3,
        currentVirtualPoint: Vector3,
        boundingBoxCenter?: Vector3
    ): Vector3 {
        // If no bounding box center provided, fall back to simple drag-based scaling
        if (!boundingBoxCenter) {
            const dragVector = currentVirtualPoint.subtract(startVirtualPoint);
            const worldMatrix = mesh.getWorldMatrix();
            const worldNormal = Vector3.TransformNormal(handle.normal, worldMatrix).normalize();
            const dragDistance = Vector3.Dot(dragVector, worldNormal);
            const boundingInfo = mesh.getBoundingInfo();
            const boundingSize = boundingInfo.boundingBox.extendSizeWorld;
            const avgSize = (boundingSize.x + boundingSize.y + boundingSize.z) / 3;
            const sensitivity = 2.0;
            const scaleFactor = 1 + (dragDistance / avgSize) * sensitivity;

            return new Vector3(
                startScale.x * scaleFactor,
                startScale.y * scaleFactor,
                startScale.z * scaleFactor
            );
        }

        // Calculate distance from bounding box center to start virtual point
        const startDistance = Vector3.Distance(boundingBoxCenter, startVirtualPoint);

        // Calculate distance from bounding box center to current virtual point
        const currentDistance = Vector3.Distance(boundingBoxCenter, currentVirtualPoint);

        // Calculate scale ratio based on distance change
        const scaleRatio = currentDistance / startDistance;

        // Apply uniform scale to all axes
        return new Vector3(
            startScale.x * scaleRatio,
            startScale.y * scaleRatio,
            startScale.z * scaleRatio
        );
    }

    /**
     * Calculate two-axis scale (planar) using distance-ratio method
     * Uses "virtual stick" metaphor - scale based on distance from pivot point
     */
    private calculateTwoAxisScale(
        mesh: AbstractMesh,
        handle: HandlePosition,
        startScale: Vector3,
        startVirtualPoint: Vector3,
        currentVirtualPoint: Vector3,
        boundingBoxCenter?: Vector3
    ): Vector3 {
        const newScale = startScale.clone();

        // If no bounding box center provided, fall back to old drag-based method
        if (!boundingBoxCenter) {
            const dragVector = currentVirtualPoint.subtract(startVirtualPoint);
            const worldMatrix = mesh.getWorldMatrix();
            const worldNormal = Vector3.TransformNormal(handle.normal, worldMatrix).normalize();
            const dragDistance = Vector3.Dot(dragVector, worldNormal);
            const boundingInfo = mesh.getBoundingInfo();
            const boundingSize = boundingInfo.boundingBox.extendSizeWorld;
            const axes = handle.axes;
            const sensitivity = 2.0;

            if (this._config.current.lockAspectRatio) {
                const avgSize = (
                    (axes.includes("X") ? boundingSize.x : 0) +
                    (axes.includes("Y") ? boundingSize.y : 0) +
                    (axes.includes("Z") ? boundingSize.z : 0)
                ) / axes.length;
                const scaleFactor = 1 + (dragDistance / avgSize) * sensitivity;

                for (const axis of axes) {
                    switch (axis) {
                        case "X": newScale.x = startScale.x * scaleFactor; break;
                        case "Y": newScale.y = startScale.y * scaleFactor; break;
                        case "Z": newScale.z = startScale.z * scaleFactor; break;
                    }
                }
            }
            return newScale;
        }

        // Calculate distance from pivot to virtual points
        const startDistance = Vector3.Distance(boundingBoxCenter, startVirtualPoint);
        const currentDistance = Vector3.Distance(boundingBoxCenter, currentVirtualPoint);

        // Calculate single scale ratio based on distance change
        // This ensures both axes scale uniformly (same amount)
        const scaleRatio = currentDistance / startDistance;

        // Apply same scale ratio to both axes
        const axes = handle.axes;
        for (const axis of axes) {
            switch (axis) {
                case "X":
                    newScale.x = startScale.x * scaleRatio;
                    break;
                case "Y":
                    newScale.y = startScale.y * scaleRatio;
                    break;
                case "Z":
                    newScale.z = startScale.z * scaleRatio;
                    break;
            }
        }

        return newScale;
    }

    /**
     * Calculate single-axis scale using distance-ratio method
     * Uses "virtual stick" metaphor - scale based on distance from pivot point
     */
    private calculateSingleAxisScale(
        mesh: AbstractMesh,
        handle: HandlePosition,
        startScale: Vector3,
        startVirtualPoint: Vector3,
        currentVirtualPoint: Vector3,
        boundingBoxCenter?: Vector3
    ): Vector3 {
        const newScale = startScale.clone();

        // Get axis direction
        const axis = handle.axes[0]; // Only one axis for face handles

        // If no bounding box center provided, fall back to old drag-based method
        if (!boundingBoxCenter) {
            const dragVector = currentVirtualPoint.subtract(startVirtualPoint);
            const worldMatrix = mesh.getWorldMatrix();
            const worldNormal = Vector3.TransformNormal(handle.normal, worldMatrix).normalize();
            const dragDistance = Vector3.Dot(dragVector, worldNormal);
            const boundingInfo = mesh.getBoundingInfo();
            const boundingSize = boundingInfo.boundingBox.extendSizeWorld;
            let axisSize: number;

            switch (axis) {
                case "X": axisSize = boundingSize.x; break;
                case "Y": axisSize = boundingSize.y; break;
                case "Z": axisSize = boundingSize.z; break;
            }

            const sensitivity = 2.0;
            const scaleFactor = 1 + (dragDistance / axisSize) * sensitivity;

            switch (axis) {
                case "X": newScale.x = startScale.x * scaleFactor; break;
                case "Y": newScale.y = startScale.y * scaleFactor; break;
                case "Z": newScale.z = startScale.z * scaleFactor; break;
            }

            return newScale;
        }

        // Calculate vector from pivot to virtual points
        const startVector = startVirtualPoint.subtract(boundingBoxCenter);
        const currentVector = currentVirtualPoint.subtract(boundingBoxCenter);

        // Get local axis vector
        let localAxisVector: Vector3;
        switch (axis) {
            case "X":
                localAxisVector = Vector3.Right();
                break;
            case "Y":
                localAxisVector = Vector3.Up();
                break;
            case "Z":
                localAxisVector = Vector3.Forward();
                break;
        }

        // Transform axis to world space
        const worldMatrix = mesh.getWorldMatrix();
        const worldAxisVector = Vector3.TransformNormal(localAxisVector, worldMatrix).normalize();

        // Project start and current vectors onto this axis
        const startProjection = Vector3.Dot(startVector, worldAxisVector);
        const currentProjection = Vector3.Dot(currentVector, worldAxisVector);

        // Calculate scale ratio for this axis
        // Avoid division by zero
        const scaleRatio = Math.abs(startProjection) > 0.001
            ? currentProjection / startProjection
            : 1.0;

        // Apply scale to this axis only
        switch (axis) {
            case "X":
                newScale.x = startScale.x * scaleRatio;
                break;
            case "Y":
                newScale.y = startScale.y * scaleRatio;
                break;
            case "Z":
                newScale.z = startScale.z * scaleRatio;
                break;
        }

        return newScale;
    }

    /**
     * Apply min/max constraints to scale
     */
    private applyConstraints(scale: Vector3): Vector3 {
        const config = this._config.current;
        const constrained = scale.clone();

        // Apply minimum scale
        constrained.x = Math.max(constrained.x, config.minScale.x);
        constrained.y = Math.max(constrained.y, config.minScale.y);
        constrained.z = Math.max(constrained.z, config.minScale.z);

        // Apply maximum scale (if set)
        if (config.maxScale) {
            constrained.x = Math.min(constrained.x, config.maxScale.x);
            constrained.y = Math.min(constrained.y, config.maxScale.y);
            constrained.z = Math.min(constrained.z, config.maxScale.z);
        }

        return constrained;
    }

    /**
     * Calculate scale delta (for display)
     */
    calculateScaleDelta(currentScale: Vector3, originalScale: Vector3): Vector3 {
        return new Vector3(
            currentScale.x - originalScale.x,
            currentScale.y - originalScale.y,
            currentScale.z - originalScale.z
        );
    }

    /**
     * Calculate scale percentage (for display)
     */
    calculateScalePercentage(currentScale: Vector3, originalScale: Vector3): Vector3 {
        return new Vector3(
            (currentScale.x / originalScale.x) * 100,
            (currentScale.y / originalScale.y) * 100,
            (currentScale.z / originalScale.z) * 100
        );
    }
}

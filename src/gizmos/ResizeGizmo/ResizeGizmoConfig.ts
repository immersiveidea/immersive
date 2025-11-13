/**
 * WebXR Resize Gizmo - Configuration Management
 */

import { Vector3 } from "@babylonjs/core";
import { ResizeGizmoConfig, DEFAULT_RESIZE_GIZMO_CONFIG, ResizeGizmoMode } from "./types";

/**
 * Helper class for managing and validating ResizeGizmo configuration
 */
export class ResizeGizmoConfigManager {
    private _config: ResizeGizmoConfig;

    constructor(userConfig?: Partial<ResizeGizmoConfig>) {
        this._config = this.mergeWithDefaults(userConfig);
        this.validate();
    }

    /**
     * Merge user config with defaults
     */
    private mergeWithDefaults(userConfig?: Partial<ResizeGizmoConfig>): ResizeGizmoConfig {
        if (!userConfig) {
            return { ...DEFAULT_RESIZE_GIZMO_CONFIG };
        }

        return {
            ...DEFAULT_RESIZE_GIZMO_CONFIG,
            ...userConfig,
            // Ensure Vector3 objects are properly cloned
            minScale: userConfig.minScale
                ? userConfig.minScale.clone()
                : DEFAULT_RESIZE_GIZMO_CONFIG.minScale.clone(),
            maxScale: userConfig.maxScale
                ? userConfig.maxScale.clone()
                : DEFAULT_RESIZE_GIZMO_CONFIG.maxScale?.clone()
        };
    }

    /**
     * Validate configuration values
     */
    private validate(): void {
        const c = this._config;

        // Validate handle size
        if (c.handleSize <= 0) {
            console.warn(`[ResizeGizmo] Invalid handleSize (${c.handleSize}), using default`);
            c.handleSize = DEFAULT_RESIZE_GIZMO_CONFIG.handleSize;
        }

        // Validate bounding box padding
        if (c.boundingBoxPadding < 0) {
            console.warn(`[ResizeGizmo] Invalid boundingBoxPadding (${c.boundingBoxPadding}), using 0`);
            c.boundingBoxPadding = 0;
        }

        // Validate wireframe alpha
        c.wireframeAlpha = Math.max(0, Math.min(1, c.wireframeAlpha));

        // Validate snap distances
        if (c.snapDistanceX <= 0) c.snapDistanceX = 0.1;
        if (c.snapDistanceY <= 0) c.snapDistanceY = 0.1;
        if (c.snapDistanceZ <= 0) c.snapDistanceZ = 0.1;

        // Validate min scale
        if (c.minScale.x <= 0) c.minScale.x = 0.01;
        if (c.minScale.y <= 0) c.minScale.y = 0.01;
        if (c.minScale.z <= 0) c.minScale.z = 0.01;

        // Validate max scale (if set)
        if (c.maxScale) {
            if (c.maxScale.x < c.minScale.x) c.maxScale.x = c.minScale.x;
            if (c.maxScale.y < c.minScale.y) c.maxScale.y = c.minScale.y;
            if (c.maxScale.z < c.minScale.z) c.maxScale.z = c.minScale.z;
        }

        // Validate DiagramEntity integration
        if (c.useDiagramEntity && !c.diagramManager) {
            console.warn("[ResizeGizmo] useDiagramEntity is true but diagramManager is not provided");
        }

        // Validate hover scale factor
        if (c.hoverScaleFactor <= 0) {
            c.hoverScaleFactor = DEFAULT_RESIZE_GIZMO_CONFIG.hoverScaleFactor;
        }
    }

    /**
     * Get current configuration (readonly)
     */
    get current(): Readonly<ResizeGizmoConfig> {
        return this._config;
    }

    /**
     * Update configuration (partial update)
     */
    update(updates: Partial<ResizeGizmoConfig>): void {
        this._config = this.mergeWithDefaults({
            ...this._config,
            ...updates
        });
        this.validate();
    }

    /**
     * Set mode
     */
    setMode(mode: ResizeGizmoMode): void {
        this._config.mode = mode;
    }

    /**
     * Get snap distance for axis
     */
    getSnapDistance(axis: "X" | "Y" | "Z"): number {
        switch (axis) {
            case "X": return this._config.snapDistanceX;
            case "Y": return this._config.snapDistanceY;
            case "Z": return this._config.snapDistanceZ;
        }
    }

    /**
     * Get snap vector
     */
    getSnapVector(): Vector3 {
        return new Vector3(
            this._config.snapDistanceX,
            this._config.snapDistanceY,
            this._config.snapDistanceZ
        );
    }

    /**
     * Check if a mode uses corner handles
     */
    usesCornerHandles(): boolean {
        const mode = this._config.mode;
        return mode === ResizeGizmoMode.UNIFORM || mode === ResizeGizmoMode.ALL;
    }

    /**
     * Check if a mode uses edge handles
     */
    usesEdgeHandles(): boolean {
        const mode = this._config.mode;
        return mode === ResizeGizmoMode.TWO_AXIS || mode === ResizeGizmoMode.ALL;
    }

    /**
     * Check if a mode uses face handles
     */
    usesFaceHandles(): boolean {
        const mode = this._config.mode;
        return mode === ResizeGizmoMode.SINGLE_AXIS || mode === ResizeGizmoMode.ALL;
    }

    /**
     * Clone configuration
     */
    clone(): ResizeGizmoConfigManager {
        return new ResizeGizmoConfigManager(this._config);
    }
}

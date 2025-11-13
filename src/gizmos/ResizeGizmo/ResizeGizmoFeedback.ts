/**
 * WebXR Resize Gizmo - Visual Feedback
 * Handles numeric displays, grids, and snap point visualization
 */

import {
    Scene,
    Vector3,
    AbstractMesh,
    LinesMesh,
    MeshBuilder,
    Color3,
    DynamicTexture,
    StandardMaterial,
    Mesh
} from "@babylonjs/core";
import { HandlePosition } from "./types";
import { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";
import { ResizeGizmoSnapping } from "./ResizeGizmoSnapping";

/**
 * Manages visual feedback during scaling operations
 */
export class ResizeGizmoFeedback {
    private _scene: Scene;
    private _config: ResizeGizmoConfigManager;
    private _snapping: ResizeGizmoSnapping;

    // Visual elements
    private _numericDisplay?: Mesh;
    private _numericTexture?: DynamicTexture;
    private _numericMaterial?: StandardMaterial;
    private _gridLines: LinesMesh[] = [];
    private _snapIndicators: Mesh[] = [];

    constructor(scene: Scene, config: ResizeGizmoConfigManager, snapping: ResizeGizmoSnapping) {
        this._scene = scene;
        this._config = config;
        this._snapping = snapping;
    }

    /**
     * Show numeric display above mesh
     */
    showNumericDisplay(mesh: AbstractMesh, scale: Vector3, originalScale: Vector3): void {
        if (!this._config.current.showNumericDisplay) {
            return;
        }

        // Create or update numeric display
        if (!this._numericDisplay) {
            this.createNumericDisplay();
        }

        if (!this._numericDisplay || !this._numericTexture) {
            return;
        }

        // Position above mesh
        const boundingInfo = mesh.getBoundingInfo();
        const max = boundingInfo.boundingBox.maximumWorld;
        this._numericDisplay.position = new Vector3(max.x, max.y + 0.5, max.z);

        // Update text
        const scalePercent = new Vector3(
            (scale.x / originalScale.x) * 100,
            (scale.y / originalScale.y) * 100,
            (scale.z / originalScale.z) * 100
        );

        const text = this.formatScaleText(scale, scalePercent);
        this.updateNumericTexture(text);

        this._numericDisplay.setEnabled(true);
    }

    /**
     * Hide numeric display
     */
    hideNumericDisplay(): void {
        if (this._numericDisplay) {
            this._numericDisplay.setEnabled(false);
        }
    }

    /**
     * Create numeric display mesh
     */
    private createNumericDisplay(): void {
        const size = 1.0;

        // Create plane for text
        this._numericDisplay = MeshBuilder.CreatePlane(
            "gizmo-numeric-display",
            { width: size * 2, height: size },
            this._scene
        );

        this._numericDisplay.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this._numericDisplay.isPickable = false;

        // Create dynamic texture
        const resolution = 512;
        this._numericTexture = new DynamicTexture(
            "gizmo-numeric-texture",
            { width: resolution * 2, height: resolution },
            this._scene,
            false
        );

        // Create material
        this._numericMaterial = new StandardMaterial("gizmo-numeric-material", this._scene);
        this._numericMaterial.diffuseTexture = this._numericTexture;
        this._numericMaterial.emissiveColor = Color3.White();
        this._numericMaterial.disableLighting = true;
        this._numericMaterial.useAlphaFromDiffuseTexture = true;

        this._numericDisplay.material = this._numericMaterial;
        this._numericDisplay.setEnabled(false);
    }

    /**
     * Format scale text for display
     */
    private formatScaleText(scale: Vector3, scalePercent: Vector3): string {
        return `X: ${scale.x.toFixed(2)} (${scalePercent.x.toFixed(0)}%)\n` +
               `Y: ${scale.y.toFixed(2)} (${scalePercent.y.toFixed(0)}%)\n` +
               `Z: ${scale.z.toFixed(2)} (${scalePercent.z.toFixed(0)}%)`;
    }

    /**
     * Update numeric texture with text
     */
    private updateNumericTexture(text: string): void {
        if (!this._numericTexture) {
            return;
        }

        const context = this._numericTexture.getContext();
        const size = this._numericTexture.getSize();

        // Clear
        context.clearRect(0, 0, size.width, size.height);

        // Draw background
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(0, 0, size.width, size.height);

        // Draw text
        context.fillStyle = "white";
        context.font = `${this._config.current.numericDisplayFontSize}px monospace`;
        context.textAlign = "center";
        context.textBaseline = "middle";

        const lines = text.split("\n");
        const lineHeight = this._config.current.numericDisplayFontSize * 1.2;
        const startY = (size.height - lineHeight * lines.length) / 2;

        lines.forEach((line, i) => {
            context.fillText(line, size.width / 2, startY + lineHeight * (i + 0.5));
        });

        this._numericTexture.update();
    }

    /**
     * Show alignment grid during scaling
     */
    showGrid(mesh: AbstractMesh, handle: HandlePosition): void {
        if (!this._config.current.showGrid) {
            return;
        }

        this.hideGrid();

        const boundingInfo = mesh.getBoundingInfo();
        const center = boundingInfo.boundingBox.centerWorld;
        const size = boundingInfo.boundingBox.extendSizeWorld.scale(2);

        // Create grid lines based on affected axes
        const axes = handle.axes;

        // Determine grid plane based on axes
        if (axes.length === 3) {
            // Uniform - show 3D grid
            this.create3DGrid(center, size);
        } else if (axes.length === 2) {
            // Two-axis - show planar grid
            this.createPlanarGrid(center, size, axes);
        } else {
            // Single-axis - show line grid
            this.createAxisGrid(center, size, axes[0]);
        }
    }

    /**
     * Hide alignment grid
     */
    hideGrid(): void {
        for (const line of this._gridLines) {
            line.dispose();
        }
        this._gridLines = [];
    }

    /**
     * Create 3D grid (for uniform scaling)
     */
    private create3DGrid(center: Vector3, size: Vector3): void {
        const gridSize = 5;
        const spacing = 0.5;
        const color = new Color3(0.5, 0.5, 0.5);

        // XY plane
        for (let i = -gridSize; i <= gridSize; i++) {
            // X lines
            const xLine = MeshBuilder.CreateLines(
                `grid-x-${i}`,
                {
                    points: [
                        new Vector3(center.x - gridSize * spacing, center.y + i * spacing, center.z),
                        new Vector3(center.x + gridSize * spacing, center.y + i * spacing, center.z)
                    ]
                },
                this._scene
            );
            xLine.color = color;
            xLine.alpha = 0.3;
            xLine.isPickable = false;
            this._gridLines.push(xLine);

            // Y lines
            const yLine = MeshBuilder.CreateLines(
                `grid-y-${i}`,
                {
                    points: [
                        new Vector3(center.x + i * spacing, center.y - gridSize * spacing, center.z),
                        new Vector3(center.x + i * spacing, center.y + gridSize * spacing, center.z)
                    ]
                },
                this._scene
            );
            yLine.color = color;
            yLine.alpha = 0.3;
            yLine.isPickable = false;
            this._gridLines.push(yLine);
        }
    }

    /**
     * Create planar grid (for two-axis scaling)
     */
    private createPlanarGrid(center: Vector3, size: Vector3, axes: ("X" | "Y" | "Z")[]): void {
        const gridSize = 5;
        const spacing = 0.5;
        const color = new Color3(0.5, 0.5, 0.5);

        // Determine which plane
        const hasX = axes.includes("X");
        const hasY = axes.includes("Y");
        const hasZ = axes.includes("Z");

        for (let i = -gridSize; i <= gridSize; i++) {
            if (hasX && hasY) {
                // XY plane
                this.createGridLine(center, i * spacing, "X", color);
                this.createGridLine(center, i * spacing, "Y", color);
            } else if (hasX && hasZ) {
                // XZ plane
                this.createGridLine(center, i * spacing, "X", color);
                this.createGridLine(center, i * spacing, "Z", color);
            } else if (hasY && hasZ) {
                // YZ plane
                this.createGridLine(center, i * spacing, "Y", color);
                this.createGridLine(center, i * spacing, "Z", color);
            }
        }
    }

    /**
     * Create axis grid (for single-axis scaling)
     */
    private createAxisGrid(center: Vector3, size: Vector3, axis: "X" | "Y" | "Z"): void {
        const color = axis === "X" ? Color3.Red() : axis === "Y" ? Color3.Green() : Color3.Blue();
        this.createGridLine(center, 0, axis, color, 1.0);
    }

    /**
     * Create a single grid line
     */
    private createGridLine(center: Vector3, offset: number, axis: "X" | "Y" | "Z", color: Color3, alpha: number = 0.3): void {
        const gridSize = 5;
        let points: Vector3[];

        switch (axis) {
            case "X":
                points = [
                    new Vector3(center.x - gridSize, center.y + offset, center.z),
                    new Vector3(center.x + gridSize, center.y + offset, center.z)
                ];
                break;
            case "Y":
                points = [
                    new Vector3(center.x + offset, center.y - gridSize, center.z),
                    new Vector3(center.x + offset, center.y + gridSize, center.z)
                ];
                break;
            case "Z":
                points = [
                    new Vector3(center.x + offset, center.y, center.z - gridSize),
                    new Vector3(center.x + offset, center.y, center.z + gridSize)
                ];
                break;
        }

        const line = MeshBuilder.CreateLines(`grid-${axis}-${offset}`, { points }, this._scene);
        line.color = color;
        line.alpha = alpha;
        line.isPickable = false;
        this._gridLines.push(line);
    }

    /**
     * Show snap point indicators
     */
    showSnapIndicators(mesh: AbstractMesh, handle: HandlePosition): void {
        if (!this._config.current.showSnapPoints || !this._snapping.isEnabled()) {
            return;
        }

        this.hideSnapIndicators();

        const boundingInfo = mesh.getBoundingInfo();
        const center = boundingInfo.boundingBox.centerWorld;
        const size = boundingInfo.boundingBox.extendSizeWorld;

        // Create snap indicators along affected axes
        for (const axis of handle.axes) {
            const snapDistance = this._config.getSnapDistance(axis);
            const axisSize = axis === "X" ? size.x : axis === "Y" ? size.y : size.z;

            const snapPoints = this._snapping.getSnapPointsInRange(
                -axisSize * 2,
                axisSize * 2,
                snapDistance
            );

            for (const snapValue of snapPoints) {
                let position: Vector3;

                switch (axis) {
                    case "X":
                        position = new Vector3(center.x + snapValue, center.y, center.z);
                        break;
                    case "Y":
                        position = new Vector3(center.x, center.y + snapValue, center.z);
                        break;
                    case "Z":
                        position = new Vector3(center.x, center.y, center.z + snapValue);
                        break;
                }

                const indicator = MeshBuilder.CreateSphere(
                    `snap-indicator-${axis}-${snapValue}`,
                    { diameter: 0.05 },
                    this._scene
                );

                indicator.position = position;
                indicator.isPickable = false;

                const material = new StandardMaterial(`snap-mat-${axis}-${snapValue}`, this._scene);
                material.emissiveColor = axis === "X" ? Color3.Red() : axis === "Y" ? Color3.Green() : Color3.Blue();
                material.alpha = 0.4;
                material.disableLighting = true;

                indicator.material = material;
                this._snapIndicators.push(indicator);
            }
        }
    }

    /**
     * Hide snap indicators
     */
    hideSnapIndicators(): void {
        for (const indicator of this._snapIndicators) {
            indicator.dispose();
            indicator.material?.dispose();
        }
        this._snapIndicators = [];
    }

    /**
     * Dispose all feedback elements
     */
    dispose(): void {
        this.hideNumericDisplay();
        this.hideGrid();
        this.hideSnapIndicators();

        if (this._numericDisplay) {
            this._numericDisplay.dispose();
            this._numericDisplay = undefined;
        }

        if (this._numericTexture) {
            this._numericTexture.dispose();
            this._numericTexture = undefined;
        }

        if (this._numericMaterial) {
            this._numericMaterial.dispose();
            this._numericMaterial = undefined;
        }
    }
}

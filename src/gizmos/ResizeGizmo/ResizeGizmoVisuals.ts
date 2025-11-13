/**
 * WebXR Resize Gizmo - Visual Rendering
 * Handles rendering of bounding boxes, handles, and visual feedback
 */

import {
    Scene,
    AbstractMesh,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    UtilityLayerRenderer,
    LinesMesh,
    Vector3
} from "@babylonjs/core";
import { HandlePosition, HandleType } from "./types";
import { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";
import { HandleGeometry } from "./HandleGeometry";

/**
 * Manages all visual elements of the resize gizmo
 */
export class ResizeGizmoVisuals {
    private _scene: Scene;
    private _utilityLayer: UtilityLayerRenderer;
    private _config: ResizeGizmoConfigManager;

    // Visual elements
    private _boundingBoxLines?: LinesMesh;
    private _handleMeshes: Map<string, Mesh> = new Map();
    private _handleMaterials: Map<string, StandardMaterial> = new Map();

    // Current state
    private _targetMesh?: AbstractMesh;
    private _handles: HandlePosition[] = [];
    private _visible: boolean = false;

    constructor(scene: Scene, config: ResizeGizmoConfigManager) {
        this._scene = scene;
        this._config = config;

        // Create utility layer for gizmo rendering
        this._utilityLayer = new UtilityLayerRenderer(scene);
        this._utilityLayer.shouldRender = true;
    }

    /**
     * Attach gizmo to a mesh and show visuals
     */
    attach(mesh: AbstractMesh): void {
        this.detach();

        this._targetMesh = mesh;
        this._visible = true;

        // Generate handle positions
        this._handles = this.generateHandlePositions();

        // Create visual elements
        this.createBoundingBox();
        this.createHandleMeshes();
    }

    /**
     * Detach from current mesh and hide visuals
     */
    detach(): void {
        this._targetMesh = undefined;
        this._visible = false;
        this._handles = [];

        this.disposeBoundingBox();
        this.disposeHandleMeshes();
    }

    /**
     * Update visuals (call when mesh transforms or config changes)
     */
    update(): void {
        if (!this._targetMesh || !this._visible) {
            return;
        }

        // Recompute bounding box
        this._targetMesh.refreshBoundingInfo();

        // Regenerate handles
        this._handles = this.generateHandlePositions();

        // Update visuals
        this.updateBoundingBox();
        this.updateHandlePositions();
    }

    /**
     * Generate handle positions based on current config and mesh bounding box
     */
    private generateHandlePositions(): HandlePosition[] {
        if (!this._targetMesh) {
            return [];
        }

        const boundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;

        // Calculate padding
        const padding = HandleGeometry.calculatePadding(
            boundingBox,
            this._config.current.boundingBoxPadding
        );

        // Generate handles based on mode
        return HandleGeometry.generateHandles(
            boundingBox,
            padding,
            this._config.usesCornerHandles(),
            this._config.usesEdgeHandles(),
            this._config.usesFaceHandles()
        );
    }

    /**
     * Create bounding box wireframe
     */
    private createBoundingBox(): void {
        if (!this._targetMesh) {
            return;
        }

        this.disposeBoundingBox();

        const boundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const min = boundingBox.minimumWorld;
        const max = boundingBox.maximumWorld;

        // Calculate padding
        const padding = HandleGeometry.calculatePadding(
            boundingBox,
            this._config.current.boundingBoxPadding
        );

        const paddedMin = min.subtract(new Vector3(padding, padding, padding));
        const paddedMax = max.add(new Vector3(padding, padding, padding));

        // Create line points for bounding box edges
        const points = [
            // Bottom face
            [paddedMin, new Vector3(paddedMax.x, paddedMin.y, paddedMin.z)],
            [new Vector3(paddedMax.x, paddedMin.y, paddedMin.z), new Vector3(paddedMax.x, paddedMin.y, paddedMax.z)],
            [new Vector3(paddedMax.x, paddedMin.y, paddedMax.z), new Vector3(paddedMin.x, paddedMin.y, paddedMax.z)],
            [new Vector3(paddedMin.x, paddedMin.y, paddedMax.z), paddedMin],
            // Top face
            [new Vector3(paddedMin.x, paddedMax.y, paddedMin.z), new Vector3(paddedMax.x, paddedMax.y, paddedMin.z)],
            [new Vector3(paddedMax.x, paddedMax.y, paddedMin.z), paddedMax],
            [paddedMax, new Vector3(paddedMin.x, paddedMax.y, paddedMax.z)],
            [new Vector3(paddedMin.x, paddedMax.y, paddedMax.z), new Vector3(paddedMin.x, paddedMax.y, paddedMin.z)],
            // Vertical edges
            [paddedMin, new Vector3(paddedMin.x, paddedMax.y, paddedMin.z)],
            [new Vector3(paddedMax.x, paddedMin.y, paddedMin.z), new Vector3(paddedMax.x, paddedMax.y, paddedMin.z)],
            [new Vector3(paddedMax.x, paddedMin.y, paddedMax.z), paddedMax],
            [new Vector3(paddedMin.x, paddedMin.y, paddedMax.z), new Vector3(paddedMin.x, paddedMax.y, paddedMax.z)]
        ];

        // Flatten points
        const flatPoints: Vector3[] = [];
        for (const line of points) {
            flatPoints.push(...line);
        }

        // Create lines mesh
        this._boundingBoxLines = MeshBuilder.CreateLineSystem(
            "gizmo-boundingbox",
            { lines: points },
            this._utilityLayer.utilityLayerScene
        );

        this._boundingBoxLines.color = this._config.current.boundingBoxColor;
        this._boundingBoxLines.alpha = this._config.current.wireframeAlpha;
        this._boundingBoxLines.isPickable = false;
    }

    /**
     * Update bounding box position/size
     */
    private updateBoundingBox(): void {
        // Recreate bounding box (simpler than updating)
        this.createBoundingBox();
    }

    /**
     * Dispose bounding box
     */
    private disposeBoundingBox(): void {
        if (this._boundingBoxLines) {
            this._boundingBoxLines.dispose();
            this._boundingBoxLines = undefined;
        }
    }

    /**
     * Create handle meshes
     */
    private createHandleMeshes(): void {
        this.disposeHandleMeshes();

        if (!this._targetMesh) {
            return;
        }

        // Calculate handle size as percentage of bounding box size
        const boundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const size = boundingBox.extendSizeWorld;
        const avgSize = (size.x + size.y + size.z) / 3;

        // Handle size is configured percentage of average bounding box dimension
        // handleSize in config is now a scale factor (e.g., 0.2 = 20% of bounding box)
        const handleSize = avgSize * this._config.current.handleSize;

        for (const handle of this._handles) {
            // Create handle mesh (box for now, could be sphere or other shape)
            const mesh = MeshBuilder.CreateBox(
                `gizmo-handle-${handle.id}`,
                { size: handleSize },
                this._utilityLayer.utilityLayerScene
            );

            mesh.position = handle.position.clone();
            mesh.isPickable = true;

            // Create material
            const material = new StandardMaterial(
                `gizmo-handle-mat-${handle.id}`,
                this._utilityLayer.utilityLayerScene
            );

            material.emissiveColor = this.getHandleColor(handle.type);
            material.disableLighting = true;

            mesh.material = material;

            // Store references
            this._handleMeshes.set(handle.id, mesh);
            this._handleMaterials.set(handle.id, material);
        }
    }

    /**
     * Get color for handle type
     */
    private getHandleColor(type: HandleType): Color3 {
        const config = this._config.current;

        switch (type) {
            case HandleType.CORNER:
                return config.cornerHandleColor;
            case HandleType.EDGE:
                return config.edgeHandleColor;
            case HandleType.FACE:
                return config.faceHandleColor;
        }
    }

    /**
     * Update handle positions
     */
    private updateHandlePositions(): void {
        for (const handle of this._handles) {
            const mesh = this._handleMeshes.get(handle.id);
            if (mesh) {
                mesh.position = handle.position.clone();
            }
        }
    }

    /**
     * Dispose handle meshes
     */
    private disposeHandleMeshes(): void {
        for (const mesh of this._handleMeshes.values()) {
            mesh.dispose();
        }
        for (const material of this._handleMaterials.values()) {
            material.dispose();
        }

        this._handleMeshes.clear();
        this._handleMaterials.clear();
    }

    /**
     * Highlight a handle (on hover)
     */
    highlightHandle(handleId: string): void {
        const mesh = this._handleMeshes.get(handleId);
        const material = this._handleMaterials.get(handleId);

        if (mesh && material) {
            material.emissiveColor = this._config.current.hoverColor;
            mesh.scaling = new Vector3(
                this._config.current.hoverScaleFactor,
                this._config.current.hoverScaleFactor,
                this._config.current.hoverScaleFactor
            );
        }
    }

    /**
     * Unhighlight a handle
     */
    unhighlightHandle(handleId: string): void {
        const handle = this._handles.find(h => h.id === handleId);
        const mesh = this._handleMeshes.get(handleId);
        const material = this._handleMaterials.get(handleId);

        if (handle && mesh && material) {
            material.emissiveColor = this.getHandleColor(handle.type);
            mesh.scaling = new Vector3(1, 1, 1);
        }
    }

    /**
     * Set handle to active state (during drag)
     */
    setHandleActive(handleId: string): void {
        const material = this._handleMaterials.get(handleId);
        if (material) {
            material.emissiveColor = this._config.current.activeColor;
        }
    }

    /**
     * Set visibility
     */
    setVisible(visible: boolean): void {
        this._visible = visible;

        if (this._boundingBoxLines) {
            this._boundingBoxLines.setEnabled(visible);
        }

        for (const mesh of this._handleMeshes.values()) {
            mesh.setEnabled(visible);
        }
    }

    /**
     * Get handle by mesh
     */
    getHandleByMesh(mesh: AbstractMesh): HandlePosition | undefined {
        for (const handle of this._handles) {
            const handleMesh = this._handleMeshes.get(handle.id);
            if (handleMesh === mesh) {
                return handle;
            }
        }
        return undefined;
    }

    /**
     * Get all handles
     */
    getHandles(): ReadonlyArray<HandlePosition> {
        return this._handles;
    }

    /**
     * Get utility layer scene
     */
    getUtilityScene(): Scene {
        return this._utilityLayer.utilityLayerScene;
    }

    /**
     * Dispose all resources
     */
    dispose(): void {
        this.detach();
        this._utilityLayer.dispose();
    }
}

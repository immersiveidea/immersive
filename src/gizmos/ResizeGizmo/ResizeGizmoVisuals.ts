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
    Vector3,
    Quaternion,
    Ray,
    BoundingBox
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
        this.updateHandleTransforms();
    }

    /**
     * Generate handle positions based on current config and mesh bounding box (OBB-based)
     */
    private generateHandlePositions(): HandlePosition[] {
        if (!this._targetMesh) {
            return [];
        }

        // Generate handles based on mode (using OBB)
        return HandleGeometry.generateHandles(
            this._targetMesh,
            this._config.current.handleOffset,
            this._config.usesCornerHandles(),
            this._config.usesEdgeHandles(),
            this._config.usesFaceHandles()
        );
    }

    /**
     * Calculate the 8 corners of the oriented bounding box (OBB) in world space
     * @param paddingFactor Optional padding factor to expand corners outward (0.03 = 3%)
     */
    private calculateOBBCorners(paddingFactor: number = 0): Vector3[] {
        if (!this._targetMesh) {
            return [];
        }

        // Get bounding box in local space
        const boundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const min = boundingBox.minimum;
        const max = boundingBox.maximum;

        // Define 8 corners in local space
        const localCorners = [
            new Vector3(min.x, min.y, min.z), // 0: left-bottom-back
            new Vector3(max.x, min.y, min.z), // 1: right-bottom-back
            new Vector3(max.x, min.y, max.z), // 2: right-bottom-front
            new Vector3(min.x, min.y, max.z), // 3: left-bottom-front
            new Vector3(min.x, max.y, min.z), // 4: left-top-back
            new Vector3(max.x, max.y, min.z), // 5: right-top-back
            new Vector3(max.x, max.y, max.z), // 6: right-top-front
            new Vector3(min.x, max.y, max.z)  // 7: left-top-front
        ];

        // Transform corners to world space using mesh's world matrix
        const worldMatrix = this._targetMesh.computeWorldMatrix(true);
        const worldCorners = localCorners.map(corner =>
            Vector3.TransformCoordinates(corner, worldMatrix)
        );

        // Apply padding if specified (expand outward from center)
        if (paddingFactor > 0) {
            const center = this._targetMesh.absolutePosition;
            const size = boundingBox.extendSize;
            const avgSize = (size.x + size.y + size.z) / 3;
            const paddingDistance = avgSize * paddingFactor;

            return worldCorners.map(corner => {
                const normal = corner.subtract(center).normalize();
                return corner.add(normal.scale(paddingDistance));
            });
        }

        return worldCorners;
    }

    /**
     * Create bounding box wireframe (OBB - oriented bounding box)
     */
    private createBoundingBox(): void {
        if (!this._targetMesh) {
            return;
        }

        this.disposeBoundingBox();

        // Get OBB corners in world space with wireframe padding
        const corners = this.calculateOBBCorners(this._config.current.wireframePadding);
        if (corners.length !== 8) {
            return;
        }

        // Create line points for bounding box edges
        // Using corner indices: 0-7 as defined in calculateOBBCorners
        const points = [
            // Bottom face (y = min)
            [corners[0], corners[1]], // left-back to right-back
            [corners[1], corners[2]], // right-back to right-front
            [corners[2], corners[3]], // right-front to left-front
            [corners[3], corners[0]], // left-front to left-back
            // Top face (y = max)
            [corners[4], corners[5]], // left-back to right-back
            [corners[5], corners[6]], // right-back to right-front
            [corners[6], corners[7]], // right-front to left-front
            [corners[7], corners[4]], // left-front to left-back
            // Vertical edges
            [corners[0], corners[4]], // left-back bottom to top
            [corners[1], corners[5]], // right-back bottom to top
            [corners[2], corners[6]], // right-front bottom to top
            [corners[3], corners[7]]  // left-front bottom to top
        ];

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

            // Extract and set rotation first (from world matrix)
            const worldMatrix = this._targetMesh.computeWorldMatrix(true);
            const rotation = new Quaternion();
            worldMatrix.decompose(undefined, rotation, undefined);
            mesh.rotationQuaternion = rotation;

            // Set world-space position (works correctly with rotation)
            mesh.setAbsolutePosition(handle.position);

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
     * Update handle transforms (position and rotation)
     */
    private updateHandleTransforms(): void {
        if (!this._targetMesh) {
            return;
        }

        for (const handle of this._handles) {
            const mesh = this._handleMeshes.get(handle.id);
            if (mesh) {
                // Update rotation to match target mesh (from world matrix)
                const worldMatrix = this._targetMesh.computeWorldMatrix(true);
                const rotation = new Quaternion();
                worldMatrix.decompose(undefined, rotation, undefined);
                mesh.rotationQuaternion = rotation;

                // Set world-space position (works correctly with rotation)
                mesh.setAbsolutePosition(handle.position);
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
     * Check if a ray intersects the expanded bounding volume that encompasses all handles
     * This creates a "grace zone" to prevent hover state loss in whitespace between mesh and handles
     *
     * Uses local space transformation for accuracy - transforms ray to mesh local space
     * and performs AABB intersection test with manual slab method
     */
    isPointerInsideHandleBoundary(ray: Ray): boolean {
        if (!this._targetMesh || !this._config.current.keepHoverInHandleBoundary) {
            return false;
        }

        // Transform ray from world space to mesh local space
        const worldMatrix = this._targetMesh.computeWorldMatrix(true);
        const invWorldMatrix = worldMatrix.clone().invert();

        const localOrigin = Vector3.TransformCoordinates(ray.origin, invWorldMatrix);
        const localDirection = Vector3.TransformNormal(ray.direction, invWorldMatrix);

        // Get local space bounding box
        const boundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const size = boundingBox.extendSize;
        const avgSize = (size.x + size.y + size.z) / 3;

        // Calculate expanded padding (handleOffset is a fraction, need to scale by avgSize)
        const handleSize = avgSize * this._config.current.handleSize;
        const paddingDistance = avgSize * this._config.current.handleOffset;
        const totalPadding = paddingDistance + (handleSize / 2);

        // Create expanded AABB in local space
        const paddingVec = new Vector3(totalPadding, totalPadding, totalPadding);
        const min = boundingBox.minimum.subtract(paddingVec);
        const max = boundingBox.maximum.add(paddingVec);

        // Ray-AABB intersection test using slab method
        // https://tavianator.com/2011/ray_box.html
        const invDir = new Vector3(
            1 / localDirection.x,
            1 / localDirection.y,
            1 / localDirection.z
        );

        const t1 = (min.x - localOrigin.x) * invDir.x;
        const t2 = (max.x - localOrigin.x) * invDir.x;
        const t3 = (min.y - localOrigin.y) * invDir.y;
        const t4 = (max.y - localOrigin.y) * invDir.y;
        const t5 = (min.z - localOrigin.z) * invDir.z;
        const t6 = (max.z - localOrigin.z) * invDir.z;

        const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

        // If tmax < 0, ray is intersecting AABB but the box is behind the ray
        if (tmax < 0) {
            return false;
        }

        // If tmin > tmax, ray doesn't intersect AABB
        if (tmin > tmax) {
            return false;
        }

        // Ray intersects the expanded bounding box
        return true;
    }

    /**
     * Dispose all resources
     */
    dispose(): void {
        this.detach();
        this._utilityLayer.dispose();
    }
}

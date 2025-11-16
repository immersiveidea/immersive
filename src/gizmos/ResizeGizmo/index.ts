import {
    AbstractMesh,
    Color3,
    Material,
    Mesh,
    MeshBuilder,
    Observable,
    Observer,
    StandardMaterial,
    UtilityLayerRenderer,
    Vector3,
    WebXRInputSource,
} from '@babylonjs/core';
import { DefaultScene } from '../../defaultScene';

/**
 * Event emitted during and after scaling operations
 */
export interface ResizeGizmoEvent {
    mesh: AbstractMesh;
}

/**
 * Handle types for the resize gizmo
 */
enum HandleType {
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
enum HandleState {
    NORMAL = 'normal',
    HOVER = 'hover',
    ACTIVE = 'active',
}

/**
 * Information about a handle
 */
interface HandleInfo {
    mesh: Mesh;
    type: HandleType;
    state: HandleState;
    material: StandardMaterial;
    /** Local space offset from target center for positioning */
    localOffset: Vector3;
}

/**
 * ResizeGizmo - Simple gizmo for resizing meshes in WebXR
 *
 * Features:
 * - 6 face handles for single-axis scaling
 * - 8 corner handles for uniform scaling
 * - XR controller grip interaction
 * - Billboard scaling for constant screen-size handles
 * - Renders in utility layer (separate from main scene)
 */
export class ResizeGizmo {
    private targetMesh: AbstractMesh;
    private utilityLayer: UtilityLayerRenderer;
    private handles: HandleInfo[] = [];

    // Materials for different states
    private normalMaterial: StandardMaterial;
    private hoverMaterial: StandardMaterial;
    private activeMaterial: StandardMaterial;

    // Interaction state
    private activeHandle: HandleInfo | null = null;
    private gripStartPosition: Vector3 | null = null;
    private initialScale: Vector3 | null = null;
    private activeController: WebXRInputSource | null = null;

    // Observables for events
    public onScaleDrag: Observable<ResizeGizmoEvent>;
    public onScaleEnd: Observable<ResizeGizmoEvent>;

    // Frame observers
    private beforeRenderObserver: Observer<any> | null = null;

    // Constants
    private static readonly HANDLE_SIZE = 0.1;
    private static readonly HANDLE_OFFSET = 0.05;
    private static readonly BILLBOARD_SCALE_DISTANCE = 10; // Reference distance for billboard scaling
    private static readonly SCALE_INCREMENT = 0.1;
    private static readonly MIN_SCALE = 0.1;

    constructor(targetMesh: AbstractMesh) {
        this.targetMesh = targetMesh;
        this.onScaleDrag = new Observable<ResizeGizmoEvent>();
        this.onScaleEnd = new Observable<ResizeGizmoEvent>();

        // Create utility layer for rendering handles
        this.utilityLayer = new UtilityLayerRenderer(DefaultScene.Scene);
        this.utilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;

        // Create materials
        this.createMaterials();

        // Create handles
        this.createHandles();

        // Set up XR interaction
        this.setupXRInteraction();

        // Set up per-frame updates
        this.setupFrameUpdates();
    }

    /**
     * Create materials for handle states
     */
    private createMaterials(): void {
        // Normal state - Gray
        this.normalMaterial = new StandardMaterial('resizeGizmo_normal', this.utilityLayer.utilityLayerScene);
        this.normalMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
        this.normalMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

        // Hover state - White
        this.hoverMaterial = new StandardMaterial('resizeGizmo_hover', this.utilityLayer.utilityLayerScene);
        this.hoverMaterial.diffuseColor = new Color3(1, 1, 1);
        this.hoverMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
        this.hoverMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2);

        // Active state - Blue
        this.activeMaterial = new StandardMaterial('resizeGizmo_active', this.utilityLayer.utilityLayerScene);
        this.activeMaterial.diffuseColor = new Color3(0.2, 0.5, 1);
        this.activeMaterial.specularColor = new Color3(0.5, 0.7, 1);
        this.activeMaterial.emissiveColor = new Color3(0.1, 0.3, 0.6);
    }

    /**
     * Create all handle meshes (6 face + 8 corner)
     */
    private createHandles(): void {
        // Face handles (single-axis scaling)
        this.createFaceHandle(HandleType.FACE_POS_X, new Vector3(1, 0, 0));
        this.createFaceHandle(HandleType.FACE_NEG_X, new Vector3(-1, 0, 0));
        this.createFaceHandle(HandleType.FACE_POS_Y, new Vector3(0, 1, 0));
        this.createFaceHandle(HandleType.FACE_NEG_Y, new Vector3(0, -1, 0));
        this.createFaceHandle(HandleType.FACE_POS_Z, new Vector3(0, 0, 1));
        this.createFaceHandle(HandleType.FACE_NEG_Z, new Vector3(0, 0, -1));

        // Corner handles (uniform scaling)
        this.createCornerHandle(HandleType.CORNER_PPP, new Vector3(1, 1, 1));
        this.createCornerHandle(HandleType.CORNER_PPN, new Vector3(1, 1, -1));
        this.createCornerHandle(HandleType.CORNER_PNP, new Vector3(1, -1, 1));
        this.createCornerHandle(HandleType.CORNER_PNN, new Vector3(1, -1, -1));
        this.createCornerHandle(HandleType.CORNER_NPP, new Vector3(-1, 1, 1));
        this.createCornerHandle(HandleType.CORNER_NPN, new Vector3(-1, 1, -1));
        this.createCornerHandle(HandleType.CORNER_NNP, new Vector3(-1, -1, 1));
        this.createCornerHandle(HandleType.CORNER_NNN, new Vector3(-1, -1, -1));

        // Initial positioning
        this.updateHandlePositions();
    }

    /**
     * Create a face handle at the specified local offset direction
     */
    private createFaceHandle(type: HandleType, direction: Vector3): void {
        const handle = MeshBuilder.CreateBox(
            `resizeHandle_${type}`,
            { size: ResizeGizmo.HANDLE_SIZE },
            this.utilityLayer.utilityLayerScene
        );

        handle.material = this.normalMaterial;

        this.handles.push({
            mesh: handle,
            type,
            state: HandleState.NORMAL,
            material: this.normalMaterial,
            localOffset: direction.clone(),
        });
    }

    /**
     * Create a corner handle at the specified local offset direction
     */
    private createCornerHandle(type: HandleType, direction: Vector3): void {
        const handle = MeshBuilder.CreateBox(
            `resizeHandle_${type}`,
            { size: ResizeGizmo.HANDLE_SIZE },
            this.utilityLayer.utilityLayerScene
        );

        handle.material = this.normalMaterial;

        this.handles.push({
            mesh: handle,
            type,
            state: HandleState.NORMAL,
            material: this.normalMaterial,
            localOffset: direction.clone().normalize(),
        });
    }

    /**
     * Update handle positions based on target mesh bounding box
     */
    private updateHandlePositions(): void {
        const boundingInfo = this.targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;

        // Get bounding box extents in local space
        const extents = boundingBox.extendSize;

        // Get target mesh world matrix and position
        const worldMatrix = this.targetMesh.getWorldMatrix();
        const targetPosition = this.targetMesh.getAbsolutePosition();
        const targetRotation = this.targetMesh.rotationQuaternion || this.targetMesh.rotation.toQuaternion();

        for (const handleInfo of this.handles) {
            // Calculate position based on handle type
            let localPos: Vector3;

            if (handleInfo.type.startsWith('face_')) {
                // Face handles: positioned at face centers
                localPos = new Vector3(
                    handleInfo.localOffset.x * extents.x,
                    handleInfo.localOffset.y * extents.y,
                    handleInfo.localOffset.z * extents.z
                );
            } else {
                // Corner handles: positioned at corners
                localPos = new Vector3(
                    handleInfo.localOffset.x * extents.x,
                    handleInfo.localOffset.y * extents.y,
                    handleInfo.localOffset.z * extents.z
                );
            }

            // Add offset to move handle outside bounding box
            const offsetDir = handleInfo.localOffset.clone().normalize();
            localPos.addInPlace(offsetDir.scale(ResizeGizmo.HANDLE_SIZE / 2 + ResizeGizmo.HANDLE_OFFSET));

            // Transform to world space
            const worldPos = Vector3.TransformCoordinates(localPos, worldMatrix);
            handleInfo.mesh.position = worldPos;

            // Apply rotation to match target mesh orientation
            handleInfo.mesh.rotationQuaternion = targetRotation.clone();

            // Apply billboard scaling
            this.applyBillboardScale(handleInfo.mesh);
        }
    }

    /**
     * Apply billboard scaling to maintain constant screen size
     */
    private applyBillboardScale(handleMesh: Mesh): void {
        const camera = this.utilityLayer.utilityLayerScene.activeCamera;
        if (!camera) return;

        const distance = Vector3.Distance(camera.position, handleMesh.position);
        const scaleFactor = distance / ResizeGizmo.BILLBOARD_SCALE_DISTANCE;

        handleMesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
    }

    /**
     * Set up XR controller interaction
     */
    private setupXRInteraction(): void {
        const xr = DefaultScene.Scene.xr;
        if (!xr) return;

        // Listen for controller added
        xr.input.onControllerAddedObservable.add((controller) => {
            const motionController = controller.motionController;
            if (!motionController) return;

            // Listen for grip button
            const gripComponent = motionController.getComponent('squeeze');
            if (gripComponent) {
                gripComponent.onButtonStateChangedObservable.add((component) => {
                    if (component.pressed) {
                        this.onGripPressed(controller);
                    } else {
                        this.onGripReleased(controller);
                    }
                });
            }
        });
    }

    /**
     * Set up per-frame updates
     */
    private setupFrameUpdates(): void {
        this.beforeRenderObserver = DefaultScene.Scene.onBeforeRenderObservable.add(() => {
            this.updateFrame();
        });
    }

    /**
     * Update each frame
     */
    private updateFrame(): void {
        // Update handle positions
        this.updateHandlePositions();

        // Check for hover states
        this.updateHoverStates();

        // Update active scaling
        if (this.activeHandle && this.activeController) {
            this.updateScaling();
        }
    }

    /**
     * Check which handle (if any) is being pointed at by XR controllers
     */
    private updateHoverStates(): void {
        const xr = DefaultScene.Scene.xr;
        if (!xr || this.activeHandle) return; // Don't update hover during active scaling

        // Reset all handles to normal
        for (const handleInfo of this.handles) {
            if (handleInfo.state === HandleState.HOVER) {
                this.setHandleState(handleInfo, HandleState.NORMAL);
            }
        }

        // Check each controller
        for (const controllerId of xr.input.controllers.keys()) {
            const pickedMesh = xr.pointerSelection.getMeshUnderPointer(controllerId);
            if (!pickedMesh) continue;

            // Check if picked mesh is one of our handles
            const handleInfo = this.handles.find(h => h.mesh === pickedMesh);
            if (handleInfo) {
                this.setHandleState(handleInfo, HandleState.HOVER);
            }
        }
    }

    /**
     * Handle grip button pressed
     */
    private onGripPressed(controller: WebXRInputSource): void {
        if (this.activeHandle) return; // Already gripping

        // Check if controller is pointing at a handle
        const pickedMesh = DefaultScene.Scene.xr?.pointerSelection.getMeshUnderPointer(controller.uniqueId);
        if (!pickedMesh) return;

        const handleInfo = this.handles.find(h => h.mesh === pickedMesh);
        if (!handleInfo) return;

        // Start gripping
        this.activeHandle = handleInfo;
        this.activeController = controller;
        this.gripStartPosition = controller.pointer.position.clone();
        this.initialScale = this.targetMesh.scaling.clone();

        this.setHandleState(handleInfo, HandleState.ACTIVE);

        // Haptic feedback
        controller.motionController?.pulse(0.5, 100);
    }

    /**
     * Handle grip button released
     */
    private onGripReleased(controller: WebXRInputSource): void {
        if (!this.activeHandle || this.activeController !== controller) return;

        // End gripping
        this.setHandleState(this.activeHandle, HandleState.NORMAL);
        this.activeHandle = null;
        this.activeController = null;
        this.gripStartPosition = null;
        this.initialScale = null;

        // Fire onScaleEnd event
        this.onScaleEnd.notifyObservers({ mesh: this.targetMesh });

        // Haptic feedback
        controller.motionController?.pulse(0.3, 50);
    }

    /**
     * Update scaling during active grip
     */
    private updateScaling(): void {
        if (!this.activeHandle || !this.activeController || !this.gripStartPosition || !this.initialScale) {
            return;
        }

        const currentPosition = this.activeController.pointer.position;
        const movement = currentPosition.subtract(this.gripStartPosition);

        // Determine scaling based on handle type
        if (this.activeHandle.type.startsWith('face_')) {
            this.applySingleAxisScaling(movement);
        } else {
            this.applyUniformScaling(movement);
        }

        // Fire onScaleDrag event
        this.onScaleDrag.notifyObservers({ mesh: this.targetMesh });
    }

    /**
     * Apply single-axis scaling from a face handle
     * Scales from opposite face (fixed pivot)
     */
    private applySingleAxisScaling(movement: Vector3): void {
        if (!this.activeHandle || !this.initialScale) return;

        // Determine which axis to scale
        const offset = this.activeHandle.localOffset;
        let axis: 'x' | 'y' | 'z';
        let direction: number;

        if (Math.abs(offset.x) > 0.5) {
            axis = 'x';
            direction = Math.sign(offset.x);
        } else if (Math.abs(offset.y) > 0.5) {
            axis = 'y';
            direction = Math.sign(offset.y);
        } else {
            axis = 'z';
            direction = Math.sign(offset.z);
        }

        // Calculate movement along the axis in world space
        const worldAxis = this.activeHandle.localOffset.clone().normalize();
        const movementAlongAxis = Vector3.Dot(movement, worldAxis);

        // Convert movement to scale delta (in increments of 0.1)
        const scaleDelta = Math.round(movementAlongAxis / ResizeGizmo.SCALE_INCREMENT) * ResizeGizmo.SCALE_INCREMENT;

        // Apply scale
        const newScale = this.initialScale.clone();
        newScale[axis] = Math.max(ResizeGizmo.MIN_SCALE, this.initialScale[axis] + scaleDelta * direction);

        // Calculate position adjustment to keep opposite face fixed
        const boundingInfo = this.targetMesh.getBoundingInfo();
        const extents = boundingInfo.boundingBox.extendSize;
        const scaleRatio = newScale[axis] / this.initialScale[axis];

        // Calculate offset in local space
        const localOffset = new Vector3(0, 0, 0);
        localOffset[axis] = extents[axis] * (scaleRatio - 1) * direction;

        // Transform to world space and adjust position
        const worldMatrix = this.targetMesh.getWorldMatrix();
        const rotation = this.targetMesh.rotationQuaternion || this.targetMesh.rotation.toQuaternion();
        const worldOffset = localOffset.applyRotationQuaternion(rotation);

        this.targetMesh.scaling = newScale;
        this.targetMesh.position.addInPlace(worldOffset);
    }

    /**
     * Apply uniform scaling from a corner handle
     * Scales from center
     */
    private applyUniformScaling(movement: Vector3): void {
        if (!this.activeHandle || !this.initialScale) return;

        // Calculate movement along the diagonal direction
        const diagonal = this.activeHandle.localOffset.clone().normalize();
        const movementAlongDiagonal = Vector3.Dot(movement, diagonal);

        // Convert movement to scale delta
        const scaleDelta = Math.round(movementAlongDiagonal / ResizeGizmo.SCALE_INCREMENT) * ResizeGizmo.SCALE_INCREMENT;

        // Apply uniform scale
        const scaleMultiplier = Math.max(ResizeGizmo.MIN_SCALE, 1 + scaleDelta);
        const newScale = this.initialScale.clone().scale(scaleMultiplier);

        // Clamp to minimum
        newScale.x = Math.max(ResizeGizmo.MIN_SCALE, newScale.x);
        newScale.y = Math.max(ResizeGizmo.MIN_SCALE, newScale.y);
        newScale.z = Math.max(ResizeGizmo.MIN_SCALE, newScale.z);

        this.targetMesh.scaling = newScale;
    }

    /**
     * Set handle state and update visual appearance
     */
    private setHandleState(handleInfo: HandleInfo, state: HandleState): void {
        handleInfo.state = state;

        switch (state) {
            case HandleState.NORMAL:
                handleInfo.mesh.material = this.normalMaterial;
                handleInfo.mesh.scaling = handleInfo.mesh.scaling.scale(1 / 1.2); // Reset scale
                break;
            case HandleState.HOVER:
                handleInfo.mesh.material = this.hoverMaterial;
                handleInfo.mesh.scaling = handleInfo.mesh.scaling.scale(1.2); // Slightly larger
                break;
            case HandleState.ACTIVE:
                handleInfo.mesh.material = this.activeMaterial;
                break;
        }
    }

    /**
     * Dispose of the gizmo and clean up resources
     */
    public dispose(): void {
        // Remove observers
        if (this.beforeRenderObserver) {
            DefaultScene.Scene.onBeforeRenderObservable.remove(this.beforeRenderObserver);
            this.beforeRenderObserver = null;
        }

        // Dispose handles
        for (const handleInfo of this.handles) {
            handleInfo.mesh.dispose();
        }
        this.handles = [];

        // Dispose materials
        this.normalMaterial.dispose();
        this.hoverMaterial.dispose();
        this.activeMaterial.dispose();

        // Dispose utility layer
        this.utilityLayer.dispose();

        // Clear observables
        this.onScaleDrag.clear();
        this.onScaleEnd.clear();
    }
}

import {
    AbstractMesh,
    Color3,
    Mesh,
    MeshBuilder,
    Observable,
    Observer,
    Ray, Scene,
    StandardMaterial,
    UtilityLayerRenderer,
    Vector3,
    WebXRDefaultExperience,
    WebXRInputSource,
} from '@babylonjs/core';

import log from 'loglevel';
import { HandleType, HandleState } from './enums';
import { ResizeGizmoEvent, HandleInfo } from './types';

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
    private _scene: Scene;
    private _xr: WebXRDefaultExperience;
    private targetMesh: AbstractMesh;
    private utilityLayer: UtilityLayerRenderer;
    private handles: HandleInfo[] = [];
    private logger = log.getLogger('ResizeGizmo');

    // Materials for different states
    private normalMaterial: StandardMaterial;
    private hoverMaterial: StandardMaterial;
    private activeMaterial: StandardMaterial;

    // Interaction state
    private activeHandle: HandleInfo | null = null;
    private activeController: WebXRInputSource | null = null;

    // Virtual Stick state
    private originalStickLength: number = 0; // World-space distance from controller to handle at grip time
    private initialLocalOffset: Vector3 | null = null; // Local-space offset from mesh center to handle center
    private initialLocalDistance: number = 0; // Length of initial local offset
    private initialScale: Vector3 | null = null; // Mesh scale at grip time

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

    constructor(targetMesh: AbstractMesh, xr: WebXRDefaultExperience) {
        this._scene = targetMesh.getScene();
        this._xr = xr;
        this.targetMesh = targetMesh;
        this.onScaleDrag = new Observable<ResizeGizmoEvent>();
        this.onScaleEnd = new Observable<ResizeGizmoEvent>();

        this.logger.info(`Creating ResizeGizmo for mesh: ${targetMesh.name} (${targetMesh.id})`);

        // Create utility layer for rendering handles
        this.utilityLayer = new UtilityLayerRenderer(this._scene);
        this.utilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;

        // Create materials
        this.createMaterials();

        // Create handles
        this.createHandles();

        this.logger.debug(`ResizeGizmo initialized with ${this.handles.length} handles (6 face + 8 corner)`);

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

        // Get target mesh world matrix and rotation
        const worldMatrix = this.targetMesh.getWorldMatrix();

        // Extract rotation from world matrix to handle all rotation types
        const targetRotation = this.targetMesh.absoluteRotationQuaternion;

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
        if (!this._xr) {
            this.logger.error('No XR present');
            return;
        }
        const controllers = this._xr.input?.controllers?.values();
        if (controllers) {
            for (const controller of controllers) {
                const motionController = controller.motionController;
                const gripComponent = motionController.getComponent('xr-standard-squeeze');
                if (gripComponent) {
                    this.logger.debug('Grip Component loaded');
                    gripComponent.onButtonStateChangedObservable.add((component) => {
                        if (component.pressed) {
                            this.onGripPressed(controller);
                        } else {
                            this.onGripReleased(controller);
                        }
                    });
                }
            }
        } else {
            this._xr.input.onControllerAddedObservable.add((controller) => {
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
        // Listen for controller added

    }

    /**
     * Set up per-frame updates
     */
    private setupFrameUpdates(): void {
        this.beforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            this.updateFrame();
        });
    }

    /**
     * Update each frame
     */
    private updateFrame(): void {
        // Update active scaling first
        if (this.activeHandle && this.activeController) {
            this.updateScaling();
            // Don't update handle positions during active scaling to prevent feedback loop
            return;
        }

        // Update handle positions (only when not actively scaling)
        this.updateHandlePositions();

        // Check for hover states
        this.updateHoverStates();
    }

    /**
     * Manually perform ray casting against utility layer handles
     * Returns the closest handle hit by the controller's ray, or null
     */
    private getHandleUnderPointer(controller: WebXRInputSource): HandleInfo | null {
        // Get controller pointer and transform to world coordinates
        const pointerWorldMatrix = controller.pointer.getWorldMatrix();
        const pointerPos = Vector3.TransformCoordinates(Vector3.Zero(), pointerWorldMatrix);
        const pointerForward = Vector3.TransformNormal(Vector3.Forward(), pointerWorldMatrix);

        // Create ray from controller pointer in world space
        const ray = new Ray(pointerPos, pointerForward, 50);

        let closestHandle: HandleInfo | null = null;
        let closestDistance = Infinity;

        // Test ray against each handle mesh in utility layer
        for (const handleInfo of this.handles) {
            const pickInfo = ray.intersectsMesh(handleInfo.mesh);

            if (pickInfo.hit && pickInfo.distance < closestDistance) {
                closestDistance = pickInfo.distance;
                closestHandle = handleInfo;

            }
        }

        return closestHandle;
    }

    /**
     * Check which handle (if any) is being pointed at by XR controllers
     */
    private updateHoverStates(): void {
        if (!this._xr || this.activeHandle) return; // Don't update hover during active scaling

        // Reset all handles to normal
        for (const handleInfo of this.handles) {
            if (handleInfo.state === HandleState.HOVER) {
                this.setHandleState(handleInfo, HandleState.NORMAL);
            }
        }

        // Check each controller with manual ray casting
        for (const controller of this._xr.input.controllers.values()) {
            const handleInfo = this.getHandleUnderPointer(controller);
            if (handleInfo) {
                //this.logger.debug(`Handle hover detected: ${handleInfo.type} by controller ${controller.uniqueId}`);
                this.setHandleState(handleInfo, HandleState.HOVER);
            }
        }
    }

    /**
     * Handle grip button pressed
     */
    private onGripPressed(controller: WebXRInputSource): void {
        this.logger.debug('GripPressed');
        if (this.activeHandle) return; // Already gripping

        // Use manual ray casting to check for handle under pointer
        const handleInfo = this.getHandleUnderPointer(controller);
        if (!handleInfo) {
            this.logger.debug(`Grip pressed but no handle under pointer (controller ${controller.uniqueId})`);
            return;
        }

        // Calculate Virtual Stick state at grip time
        // 1. Get controller world position
        const pointerWorldMatrix = controller.pointer.getWorldMatrix();
        const controllerWorldPos = Vector3.TransformCoordinates(Vector3.Zero(), pointerWorldMatrix);

        // 2. Get handle center world position (original "end of stick")
        const handleWorldPos = handleInfo.mesh.position.clone();

        // 3. Calculate original stick length in world space
        this.originalStickLength = Vector3.Distance(controllerWorldPos, handleWorldPos);

        // 4. Get target mesh center in world space
        const meshWorldMatrix = this.targetMesh.getWorldMatrix();
        const meshWorldCenter = Vector3.TransformCoordinates(Vector3.Zero(), meshWorldMatrix);

        // 5. Calculate initial offset in local space (from mesh center to handle center)
        const meshInverseMatrix = meshWorldMatrix.clone().invert();
        const handleLocalPos = Vector3.TransformCoordinates(handleWorldPos, meshInverseMatrix);
        this.initialLocalOffset = handleLocalPos.clone();
        this.initialLocalDistance = handleLocalPos.length();

        // 6. Store initial scale
        this.initialScale = this.targetMesh.scaling.clone();

        // Set active state
        this.activeHandle = handleInfo;
        this.activeController = controller;

        this.logger.info(`Grip started on handle: ${handleInfo.type}`);
        this.logger.debug(`  Original stick length (world): ${this.originalStickLength.toFixed(3)}`);
        this.logger.debug(`  Initial local offset: ${this.initialLocalOffset.toString()}`);
        this.logger.debug(`  Initial local distance: ${this.initialLocalDistance.toFixed(3)}`);
        this.logger.debug(`  Initial scale: ${this.initialScale.toString()}`);

        this.setHandleState(handleInfo, HandleState.ACTIVE);

        // Haptic feedback
        controller.motionController?.pulse(0.5, 100);
    }

    /**
     * Handle grip button released
     */
    private onGripReleased(controller: WebXRInputSource): void {
        if (!this.activeHandle || this.activeController !== controller) return;

        const handleType = this.activeHandle.type;

        // Round scale to nearest 0.1 increment on release
        this.applyRoundedScale();

        const finalScale = this.targetMesh.scaling.clone();

        this.logger.info(`Grip released on handle: ${handleType}`);
        this.logger.debug(`  Final scale (after rounding): ${finalScale.toString()}`);
        this.logger.debug(`  Scale change: x=${(finalScale.x / this.initialScale!.x).toFixed(2)}, y=${(finalScale.y / this.initialScale!.y).toFixed(2)}, z=${(finalScale.z / this.initialScale!.z).toFixed(2)}`);

        // End gripping
        this.setHandleState(this.activeHandle, HandleState.NORMAL);
        this.activeHandle = null;
        this.activeController = null;

        // Clear Virtual Stick state
        this.originalStickLength = 0;
        this.initialLocalOffset = null;
        this.initialLocalDistance = 0;
        this.initialScale = null;

        // Fire onScaleEnd event
        this.onScaleEnd.notifyObservers({ mesh: this.targetMesh });

        // Haptic feedback
        controller.motionController?.pulse(0.3, 50);
    }

    /**
     * Update scaling during active grip using Virtual Stick approach
     */
    private updateScaling(): void {
        if (!this.activeHandle || !this.activeController || !this.initialLocalOffset || !this.initialScale) {
            return;
        }

        // 1. Calculate new "end of stick" position in world space
        const pointerWorldMatrix = this.activeController.pointer.getWorldMatrix();
        const controllerWorldPos = Vector3.TransformCoordinates(Vector3.Zero(), pointerWorldMatrix);
        const controllerWorldForward = Vector3.TransformNormal(Vector3.Forward(), pointerWorldMatrix);

        // Extend forward by original stick length (fixed length)
        const newStickEndWorld = controllerWorldPos.add(controllerWorldForward.scale(this.originalStickLength));

        // 2. Transform new stick-end position to target mesh's local space
        const meshWorldMatrix = this.targetMesh.getWorldMatrix();
        const meshInverseMatrix = meshWorldMatrix.clone().invert();
        const newStickEndLocal = Vector3.TransformCoordinates(newStickEndWorld, meshInverseMatrix);

        // 3. Calculate new distance in local space
        const newLocalDistance = newStickEndLocal.length();

        // 4. Calculate scale ratio (no rounding during drag for smooth scaling)
        const scaleRatio = newLocalDistance / this.initialLocalDistance;

        // 5. Apply scaling based on handle type
        if (this.activeHandle.type.startsWith('face_')) {
            this.applySingleAxisScaling(scaleRatio, newStickEndLocal);
        } else {
            this.applyUniformScaling(scaleRatio);
        }

        // Fire onScaleDrag event
        this.onScaleDrag.notifyObservers({ mesh: this.targetMesh });
    }

    /**
     * Apply single-axis scaling from a face handle
     * Scales only the appropriate axis based on scale ratio
     */
    private applySingleAxisScaling(scaleRatio: number, newStickEndLocal: Vector3): void {
        if (!this.activeHandle || !this.initialScale || !this.initialLocalOffset) return;

        // Determine which axis to scale based on initial local offset
        const offset = this.initialLocalOffset;
        let axis: 'x' | 'y' | 'z';

        if (Math.abs(offset.x) > Math.abs(offset.y) && Math.abs(offset.x) > Math.abs(offset.z)) {
            axis = 'x';
        } else if (Math.abs(offset.y) > Math.abs(offset.z)) {
            axis = 'y';
        } else {
            axis = 'z';
        }

        // Apply scale ratio to the appropriate axis
        const newScale = this.initialScale.clone();
        newScale[axis] = Math.max(ResizeGizmo.MIN_SCALE, this.initialScale[axis] * scaleRatio);

        this.logger.debug(`Single-axis scaling: axis=${axis.toUpperCase()}, ratio=${scaleRatio.toFixed(2)}, new scale=${newScale[axis].toFixed(2)}`);

        this.targetMesh.scaling = newScale;
    }

    /**
     * Apply uniform scaling from a corner handle
     * Scales all axes uniformly based on scale ratio
     */
    private applyUniformScaling(scaleRatio: number): void {
        if (!this.initialScale) return;

        // Apply scale ratio uniformly to all axes
        const newScale = this.initialScale.clone().scale(scaleRatio);

        // Clamp to minimum
        newScale.x = Math.max(ResizeGizmo.MIN_SCALE, newScale.x);
        newScale.y = Math.max(ResizeGizmo.MIN_SCALE, newScale.y);
        newScale.z = Math.max(ResizeGizmo.MIN_SCALE, newScale.z);

        this.logger.debug(`Uniform scaling: ratio=${scaleRatio.toFixed(2)}, new scale=(${newScale.x.toFixed(2)}, ${newScale.y.toFixed(2)}, ${newScale.z.toFixed(2)})`);

        this.targetMesh.scaling = newScale;
    }

    /**
     * Apply rounded scale on grip release
     * Face handles: round only the scaled axis
     * Corner handles: round uniformly on all axes
     */
    private applyRoundedScale(): void {
        if (!this.activeHandle || !this.initialScale) return;

        const currentScale = this.targetMesh.scaling.clone();
        const newScale = this.initialScale.clone();

        if (this.activeHandle.type.startsWith('face_')) {
            // Face handle: round only the affected axis
            const offset = this.initialLocalOffset!;
            let axis: 'x' | 'y' | 'z';

            // Determine which axis was scaled
            if (Math.abs(offset.x) > Math.abs(offset.y) && Math.abs(offset.x) > Math.abs(offset.z)) {
                axis = 'x';
            } else if (Math.abs(offset.y) > Math.abs(offset.z)) {
                axis = 'y';
            } else {
                axis = 'z';
            }

            // Calculate and round the ratio for this axis
            const ratio = currentScale[axis] / this.initialScale[axis];
            const roundedRatio = Math.round(ratio * 10) / 10;

            // Apply rounded ratio
            newScale[axis] = Math.max(ResizeGizmo.MIN_SCALE, this.initialScale[axis] * roundedRatio);

            // Keep other axes unchanged
            const otherAxes = ['x', 'y', 'z'].filter(a => a !== axis) as ('x' | 'y' | 'z')[];
            otherAxes.forEach(a => newScale[a] = currentScale[a]);

            this.logger.debug(`Rounding face handle: axis=${axis}, ratio=${ratio.toFixed(3)} → ${roundedRatio.toFixed(1)}`);

        } else {
            // Corner handle: round uniformly
            // Use average ratio across all axes
            const avgRatio = (
                (currentScale.x / this.initialScale.x) +
                (currentScale.y / this.initialScale.y) +
                (currentScale.z / this.initialScale.z)
            ) / 3;

            const roundedRatio = Math.round(avgRatio * 10) / 10;

            // Apply same rounded ratio to all axes
            newScale.x = Math.max(ResizeGizmo.MIN_SCALE, this.initialScale.x * roundedRatio);
            newScale.y = Math.max(ResizeGizmo.MIN_SCALE, this.initialScale.y * roundedRatio);
            newScale.z = Math.max(ResizeGizmo.MIN_SCALE, this.initialScale.z * roundedRatio);

            this.logger.debug(`Rounding corner handle: ratio=${avgRatio.toFixed(3)} → ${roundedRatio.toFixed(1)}`);
        }

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
        this.logger.info(`Disposing ResizeGizmo for mesh: ${this.targetMesh.name} (${this.targetMesh.id})`);

        // Remove observers
        if (this.beforeRenderObserver) {
            this._scene.onBeforeRenderObservable.remove(this.beforeRenderObserver);
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

        this._xr = null;
        this._scene = null;
    }
}

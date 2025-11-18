import {
    AbstractMesh,
    MeshBuilder,
    Observable,
    Observer,
    PickingInfo,
    Quaternion,
    Ray,
    Scene,
    StandardMaterial,
    Color3,
    UtilityLayerRenderer,
    Vector3,
    WebXRDefaultExperience,
    WebXRInputSource, Color4,
} from '@babylonjs/core';

import log from 'loglevel';
import { HandleState, CORNER_POSITIONS, FACE_POSITIONS} from './enums';
import { ResizeGizmoEvent } from './types';

/**
 * ResizeGizmo - Step 1: Corner Handles Only
 *
 * Creates 8 cube handles (0.1 size) positioned at bounding box corners
 */
export class ResizeGizmo {

    private _scene: Scene;
    private _utilityLayer: UtilityLayerRenderer;
    private _xr: WebXRDefaultExperience;
    private _targetMesh: AbstractMesh;
    private _logger = log.getLogger('ResizeGizmo');

    // Handle data
    private _handles: AbstractMesh[] = [];
    private _handleMaterial: StandardMaterial;
    private _hoveredHandle: AbstractMesh | null = null;
    private _hoveringController: WebXRInputSource | null = null;

    // Scaling state
    private _isScaling: boolean = false;
    private _activeController: WebXRInputSource | null = null;
    private _activeHandle: AbstractMesh | null = null;
    private _activeHandleType: 'corner' | 'face' = 'corner';
    private _activeAxis: 'x' | 'y' | 'z' | null = null; // Only used for face handles
    private _originalStickLength: number = 0;
    private _originalHandleDistance: number = 0;
    private _initialScale: Vector3 | null = null;

    // Track target mesh transform changes
    private _lastPosition: Vector3 | null = null;
    private _lastRotationQuaternion: Quaternion | null = null;

    // Frame update observer
    private _frameObserver: Observer<Scene> | null = null;

    // Observables for events
    public onScaleDrag: Observable<ResizeGizmoEvent>;
    public onScaleEnd: Observable<ResizeGizmoEvent>;

    // Static reference to utility layer
    public static utilityLayer: UtilityLayerRenderer;


    constructor(targetMesh: AbstractMesh, xr: WebXRDefaultExperience) {
        this._scene = targetMesh.getScene();
        this._xr = xr;
        this._targetMesh = targetMesh;
        
        // Initialize observables
        this.onScaleDrag = new Observable<ResizeGizmoEvent>();
        this.onScaleEnd = new Observable<ResizeGizmoEvent>();

        this._logger.info(`Creating ResizeGizmo for mesh: ${targetMesh.name} (${targetMesh.id})`);

        // Create utility layer for rendering handles
        this._utilityLayer = new UtilityLayerRenderer(this._scene);
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        ResizeGizmo.utilityLayer = this._utilityLayer;

        // Create material
        this.createMaterial();

        // Create 8 corner handles
        this.createHandles();

        this._logger.debug(`ResizeGizmo initialized with ${this._handles.length} corner handles`);

        // Set up per-frame updates
        this.setupFrameUpdates();

        // Set up XR input handlers
        this.setupXRInputHandlers();
    }

    /**
     * Create simple material for handles
     */
    private createMaterial(): void {
        this._handleMaterial = new StandardMaterial('resizeGizmoMaterial', this._utilityLayer.utilityLayerScene);
        this._handleMaterial.diffuseColor = Color3.Blue();
        this._handleMaterial.emissiveColor = Color3.Blue().scale(0.3);
    }

    /**
     * Create corner and face handles
     */
    private createHandles(): void {
        // Get bounding box for positioning
        const targetBoundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = targetBoundingInfo.boundingBox;
        const bboxCenter = boundingBox.centerWorld;
        const extents = boundingBox.extendSize;
        const innerCorners = boundingBox.vectorsWorld;
        const worldMatrix = this._targetMesh.getWorldMatrix();

        // Calculate handle size once (based on corner distance)
        const handleSize = innerCorners[0].subtract(bboxCenter).length() * .5;

        // Create corner handles
        CORNER_POSITIONS.forEach((cornerDef, index) => {
            const cornerPos = innerCorners[index];

            const handleMesh = MeshBuilder.CreateBox(
                `resizeHandle_${cornerDef.name}`,
                { size: handleSize },
                this._utilityLayer.utilityLayerScene
            );

            // Position outward from center so handle corner touches bounding box corner
            const direction = cornerPos.subtract(bboxCenter).normalize();
            const offset = direction.scale(handleSize * Math.sqrt(3) / 2);
            handleMesh.position = cornerPos.add(offset);
            handleMesh.rotationQuaternion = this._targetMesh.absoluteRotationQuaternion;
            handleMesh.material = this._handleMaterial;
            handleMesh.isPickable = true;

            this._handles.push(handleMesh);
        });

        // Create face handles
        FACE_POSITIONS.forEach((faceDef) => {
            // Calculate face center position in world space
            const localFacePos = new Vector3(
                faceDef.position.x * extents.x,
                faceDef.position.y * extents.y,
                faceDef.position.z * extents.z
            );
            const faceCenterWorld = Vector3.TransformCoordinates(localFacePos, worldMatrix);

            const handleMesh = MeshBuilder.CreateBox(
                `resizeHandle_${faceDef.name}`,
                { size: handleSize },
                this._utilityLayer.utilityLayerScene
            );

            // Position outward from center so handle touches face center
            const direction = faceCenterWorld.subtract(bboxCenter).normalize();
            const offset = direction.scale(handleSize * Math.sqrt(3) / 2);
            handleMesh.position = faceCenterWorld.add(offset);
            handleMesh.rotationQuaternion = this._targetMesh.absoluteRotationQuaternion;
            handleMesh.material = this._handleMaterial;
            handleMesh.isPickable = true;

            this._handles.push(handleMesh);
        });

        this._logger.debug(`Created ${this._handles.length} handles (8 corner + 6 face)`);
    }


    /**
     * Set up per-frame updates
     */
    private setupFrameUpdates(): void {
        // Initialize position and rotation tracking
        this._lastPosition = this._targetMesh.absolutePosition.clone();
        this._lastRotationQuaternion = this._targetMesh.absoluteRotationQuaternion.clone();

        this._frameObserver = this._scene.onBeforeRenderObservable.add(() => {
            // Check for handle picking with XR controllers
            this.checkXRControllerPicking();

            // Update handle scaling based on camera distance
            this.updateHandleScaling();

            // Update scaling if active
            if (this._isScaling) {
                this.updateScaling();
            } else {
                // Only check for transform changes when not actively scaling
                this.checkTransformChanges();
            }
        });
    }

    /**
     * Update handle scaling based on camera distance for consistent visual size
     */
    private updateHandleScaling(): void {
        const camera = this._scene.activeCamera;
        if (!camera) return;

        for (const handle of this._handles) {
            const distance = Vector3.Distance(camera.globalPosition, handle.position);
            const scaleFactor = distance; // Adjust multiplier to control visual size
            handle.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
        }
    }

    /**
     * Check if XR controllers are pointing at any handles
     */
    private checkXRControllerPicking(): void {
        if (!this._xr || !this._xr.input) return;

        let newHoveredHandle: AbstractMesh | null = null;
        let newController: WebXRInputSource | null = null;
        // Check each controller
        for (const controller of this._xr.input.controllers) {
            const ray = this.getControllerRay(controller);
            if (!ray) continue;

            const pickInfo = this.pickHandle(ray);

            if (pickInfo && pickInfo.pickedMesh) {
                newHoveredHandle = pickInfo.pickedMesh as AbstractMesh;
                newController = controller;
                break; // Use first hit
            }
        }

        // Update hover state if changed
        if (newHoveredHandle !== this._hoveredHandle) {
            // Clear previous hover
            if (this._hoveredHandle) {
                this._hoveredHandle.disableEdgesRendering();
            }

            // Set new hover
            this._hoveredHandle = newHoveredHandle;
            this._hoveringController = newController;
            if (this._hoveredHandle && newController) {
                this._hoveredHandle.enableEdgesRendering();
                this._hoveredHandle.edgesWidth = .1;
                this._hoveredHandle.edgesColor = Color4.FromColor3(Color3.White());

                // Pulse only on first hover
                newController.motionController.pulse(.2, 100);
            }
        }
    }

    /**
     * Set up XR input handlers for grab button
     */
    private setupXRInputHandlers(): void {
        if (!this._xr || !this._xr.input) return;

        // Hook up existing controllers
        for (const controller of this._xr.input.controllers) {
            this.setupControllerInput(controller);
        }

        // Listen for new controllers
        this._xr.input.onControllerAddedObservable.add((controller) => {
            this.setupControllerInput(controller);
        });
    }

    /**
     * Set up input listeners for a controller
     */
    private setupControllerInput(controller: WebXRInputSource): void {
        // If motion controller is already initialized, set up immediately
        if (controller.motionController) {
            this.setupSqueezeButton(controller);
        } else {
            // Otherwise wait for initialization
            controller.onMotionControllerInitObservable.add(() => {
                this.setupSqueezeButton(controller);
            });
        }
    }

    /**
     * Set up squeeze button listener for a controller
     */
    private setupSqueezeButton(controller: WebXRInputSource): void {
        const squeezeComponent = controller.motionController?.getComponentOfType('squeeze');
        if (squeezeComponent) {
            squeezeComponent.onButtonStateChangedObservable.add((component) => {
                if (component.pressed) {
                    this.onHandleGrabbed(controller);
                } else {
                    this.onHandleReleased(controller);
                }
            });
        }
    }

    /**
     * Called when a controller presses grab while hovering a handle
     */
    private onHandleGrabbed(controller: WebXRInputSource): void {
        // Only respond if this controller is hovering a handle
        if (controller === this._hoveringController && this._hoveredHandle) {
            this._logger.info(`Handle grabbed: ${this._hoveredHandle.name} by controller ${controller.uniqueId}`);

            // Pulse feedback
            controller.motionController.pulse(0.5, 50);

            // Get controller world position
            const pointerWorldMatrix = controller.pointer.getWorldMatrix();
            const controllerWorldPos = Vector3.TransformCoordinates(Vector3.Zero(), pointerWorldMatrix);

            // Get handle center world position
            const handleWorldPos = this._hoveredHandle.position;

            // Store original stick length (distance from controller to handle)
            this._originalStickLength = Vector3.Distance(controllerWorldPos, handleWorldPos);

            // Get bounding box center world position
            const boundingInfo = this._targetMesh.getBoundingInfo();
            const bboxCenterWorld = boundingInfo.boundingBox.centerWorld;

            // Store original handle distance (distance from bbox center to handle)
            this._originalHandleDistance = Vector3.Distance(bboxCenterWorld, handleWorldPos);

            // Store initial scale
            this._initialScale = this._targetMesh.scaling.clone();

            // Determine handle type and axis from handle name
            const handleName = this._hoveredHandle.name;
            if (handleName.includes('FACE_')) {
                this._activeHandleType = 'face';
                // Extract axis from face name (FACE_POS_X, FACE_NEG_Y, etc.)
                if (handleName.includes('_X')) {
                    this._activeAxis = 'x';
                } else if (handleName.includes('_Y')) {
                    this._activeAxis = 'y';
                } else if (handleName.includes('_Z')) {
                    this._activeAxis = 'z';
                }
            } else {
                this._activeHandleType = 'corner';
                this._activeAxis = null;
            }

            // Set scaling state
            this._isScaling = true;
            this._activeController = controller;
            this._activeHandle = this._hoveredHandle;

            // Change outline to blue to indicate grabbed state
            this._activeHandle.edgesColor = Color4.FromColor3(Color3.Blue());

            this._logger.debug(`Scaling started: type=${this._activeHandleType}, axis=${this._activeAxis}, stickLength=${this._originalStickLength}, handleDistance=${this._originalHandleDistance}`);
        }
    }

    /**
     * Called when a controller releases grab button
     */
    private onHandleReleased(controller: WebXRInputSource): void {
        // Only respond if this controller is the active scaling controller
        if (controller === this._activeController && this._isScaling && this._initialScale) {
            this._logger.info(`Handle released by controller ${controller.uniqueId}`);

            // Snap scale to 0.1 increments
            const currentScale = this._targetMesh.scaling;
            let roundedScale: Vector3;

            if (this._activeHandleType === 'face' && this._activeAxis) {
                // Face handle: only round the active axis
                roundedScale = currentScale.clone();
                roundedScale[this._activeAxis] = Math.round(currentScale[this._activeAxis] * 10) / 10;
            } else {
                // Corner handle: round all axes
                roundedScale = new Vector3(
                    Math.round(currentScale.x * 10) / 10,
                    Math.round(currentScale.y * 10) / 10,
                    Math.round(currentScale.z * 10) / 10
                );
            }

            // Apply snapped scale
            this._targetMesh.scaling = roundedScale;

            // Change outline back to white
            if (this._activeHandle) {
                this._activeHandle.edgesColor = Color4.FromColor3(Color3.White());
            }

            // Notify observers
            this.onScaleEnd.notifyObservers({ mesh: this._targetMesh });

            // Clear scaling state
            this._isScaling = false;
            this._activeController = null;
            this._activeHandle = null;
            this._initialScale = null;

            // Pulse feedback
            controller.motionController.pulse(0.3, 30);

            this._logger.debug(`Scaling ended: final scale=${roundedScale}`);
        }
    }

    /**
     * Update scaling during active grab
     * Called every frame while _isScaling is true
     */
    private updateScaling(): void {
        if (!this._activeController || !this._initialScale) return;

        // Get controller world position and forward direction
        const pointerWorldMatrix = this._activeController.pointer.getWorldMatrix();
        const controllerWorldPos = Vector3.TransformCoordinates(Vector3.Zero(), pointerWorldMatrix);
        const controllerForward = Vector3.TransformNormal(Vector3.Forward(), pointerWorldMatrix);

        // Calculate virtual stick end position (fixed length from controller)
        const virtualStickEnd = controllerWorldPos.add(controllerForward.scale(this._originalStickLength));

        // Get bounding box center world position
        const boundingInfo = this._targetMesh.getBoundingInfo();
        const bboxCenterWorld = boundingInfo.boundingBox.centerWorld;

        // Calculate new distance from bbox center to virtual stick end
        const newDistance = Vector3.Distance(bboxCenterWorld, virtualStickEnd);

        // Calculate scale ratio
        const scaleRatio = newDistance / this._originalHandleDistance;

        // Apply scaling based on handle type
        if (this._activeHandleType === 'face' && this._activeAxis) {
            // Face handle: scale only on the active axis
            const newScale = this._initialScale.clone();
            newScale[this._activeAxis] = this._initialScale[this._activeAxis] * scaleRatio;
            this._targetMesh.scaling = newScale;
        } else {
            // Corner handle: uniform scaling on all axes
            this._targetMesh.scaling = this._initialScale.scale(scaleRatio);
        }

        // Update handle positions and sizes to match new bounding box
        this.updateHandleTransforms();

        // Notify observers
        this.onScaleDrag.notifyObservers({ mesh: this._targetMesh });
    }

    /**
     * Check if target mesh position or rotation has changed, and update handles if needed
     */
    private checkTransformChanges(): void {
        if (!this._lastPosition || !this._lastRotationQuaternion) return;

        const currentPosition = this._targetMesh.absolutePosition;
        const currentRotationQuaternion = this._targetMesh.absoluteRotationQuaternion;

        // Check if position changed (using a small epsilon for floating point comparison)
        const positionChanged = !currentPosition.equalsWithEpsilon(this._lastPosition, 0.0001);

        // Check if rotation changed
        const rotationChanged = !currentRotationQuaternion.equalsWithEpsilon(this._lastRotationQuaternion, 0.0001);

        if (positionChanged || rotationChanged) {
            // Update handles to match new transform
            this.updateHandleTransforms();

            // Update tracked values
            this._lastPosition = currentPosition.clone();
            this._lastRotationQuaternion = currentRotationQuaternion.clone();
        }
    }

    /**
     * Update handle positions and sizes to match current target mesh bounding box
     */
    private updateHandleTransforms(): void {
        const targetBoundingInfo = this._targetMesh.getBoundingInfo();
        const boundingBox = targetBoundingInfo.boundingBox;
        const bboxCenter = boundingBox.centerWorld;
        const extents = boundingBox.extendSize;
        const innerCorners = boundingBox.vectorsWorld;
        const worldMatrix = this._targetMesh.getWorldMatrix();

        // Recalculate handle size based on new bounding box
        const newHandleSize = innerCorners[0].subtract(bboxCenter).length() * .2;

        let handleIndex = 0;

        // Update corner handles (first 8 handles)
        for (let i = 0; i < CORNER_POSITIONS.length; i++) {
            const handle = this._handles[handleIndex];
            const cornerPos = innerCorners[i];

            // Update position
            const direction = cornerPos.subtract(bboxCenter).normalize();
            const offset = direction.scale(newHandleSize * Math.sqrt(3) / 2);
            handle.position = cornerPos.add(offset);
            handle.rotationQuaternion = this._targetMesh.absoluteRotationQuaternion;

            handleIndex++;
        }

        // Update face handles (next 6 handles)
        for (const faceDef of FACE_POSITIONS) {
            const handle = this._handles[handleIndex];

            // Calculate face center position in world space
            const localFacePos = new Vector3(
                faceDef.position.x * extents.x,
                faceDef.position.y * extents.y,
                faceDef.position.z * extents.z
            );
            const faceCenterWorld = Vector3.TransformCoordinates(localFacePos, worldMatrix);

            // Update position
            const direction = faceCenterWorld.subtract(bboxCenter).normalize();
            const offset = direction.scale(newHandleSize * Math.sqrt(3) / 2);
            handle.position = faceCenterWorld.add(offset);
            handle.rotationQuaternion = this._targetMesh.absoluteRotationQuaternion;

            handleIndex++;
        }
    }

    /**
     * Get a ray from an XR controller's pointer
     * @param controller - XR input source
     * @returns Ray in world space, or null if controller has no pointer
     */
    private getControllerRay(controller: WebXRInputSource): Ray | null {
        if (!controller.pointer) return null;

        const pointerWorldMatrix = controller.pointer.getWorldMatrix();
        const origin = Vector3.TransformCoordinates(Vector3.Zero(), pointerWorldMatrix);
        const forward = Vector3.TransformNormal(Vector3.Forward(), pointerWorldMatrix);

        return new Ray(origin, forward, 50);
    }

    /**
     * Get target mesh
     */
    public get targetMesh(): AbstractMesh {
        return this._targetMesh;
    }

    /**
     * Test if a ray intersects any handle in the utility layer
     * @param ray - Ray to test (in world space)
     * @returns PickingInfo with the closest handle hit, or null if no hit
     */
    public pickHandle(ray: Ray): PickingInfo | null {
        const pickResult = this._utilityLayer.utilityLayerScene.pickWithRay(ray);

        if (pickResult && pickResult.hit && this._handles.includes(pickResult.pickedMesh as AbstractMesh)) {
            return pickResult;
        }

        return null;
    }

    /**
     * Dispose of the gizmo and clean up resources
     */
    public dispose(): void {
        this._logger.debug('Disposing ResizeGizmo');

        // Remove frame observer
        if (this._frameObserver) {
            this._scene.onBeforeRenderObservable.remove(this._frameObserver);
            this._frameObserver = null;
        }

        // Clear hover state
        if (this._hoveredHandle) {
            this._hoveredHandle.disableEdgesRendering();
            this._hoveredHandle = null;
        }

        // Dispose handles
        for (const mesh of this._handles) {
            mesh.dispose();
        }
        this._handles = [];

        // Dispose material
        if (this._handleMaterial) {
            this._handleMaterial.dispose();
        }

        // Dispose utility layer
        if (this._utilityLayer) {
            this._utilityLayer.dispose();
        }

        // Clear observables
        this.onScaleDrag.clear();
        this.onScaleEnd.clear();

        this._logger.info('ResizeGizmo disposed');
    }
}

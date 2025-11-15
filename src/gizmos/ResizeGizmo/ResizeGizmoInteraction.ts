/**
 * WebXR Resize Gizmo - Interaction Handling
 * Manages WebXR pointer detection and grip button interactions
 */

import {
    Scene,
    AbstractMesh,
    Ray,
    Vector3,
    Observer,
    PointerInfo,
    PointerEventTypes,
    WebXRInputSource,
    PickingInfo
} from "@babylonjs/core";
import {
    HandlePosition,
    InteractionState,
    GizmoInteractionState,
    ResizeGizmoEvent,
    ResizeGizmoEventType
} from "./types";
import { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";
import { ResizeGizmoVisuals } from "./ResizeGizmoVisuals";
import { ScalingCalculator } from "./ScalingCalculator";
import { ResizeGizmoSnapping } from "./ResizeGizmoSnapping";
import { ResizeGizmoFeedback } from "./ResizeGizmoFeedback";

/**
 * Result of handle detection including pick information
 */
interface HandlePickResult {
    handle: HandlePosition;
    pickInfo: PickingInfo;
    controller: WebXRInputSource;
}

/**
 * Handles all WebXR interaction logic for the resize gizmo
 */
export class ResizeGizmoInteraction {
    private _scene: Scene;
    private _config: ResizeGizmoConfigManager;
    private _visuals: ResizeGizmoVisuals;
    private _calculator: ScalingCalculator;
    private _snapping: ResizeGizmoSnapping;
    private _feedback: ResizeGizmoFeedback;

    // State
    private _state: GizmoInteractionState = {
        state: InteractionState.IDLE
    };

    // Observers
    private _pointerObserver?: Observer<PointerInfo>;
    private _xrControllers: Map<string, WebXRInputSource> = new Map();
    private _gripObservers: Map<string, any> = new Map();

    // Event callback
    private _onScaleChange?: (event: ResizeGizmoEvent) => void;

    constructor(
        scene: Scene,
        config: ResizeGizmoConfigManager,
        visuals: ResizeGizmoVisuals,
        calculator: ScalingCalculator,
        snapping: ResizeGizmoSnapping,
        feedback: ResizeGizmoFeedback
    ) {
        this._scene = scene;
        this._config = config;
        this._visuals = visuals;
        this._calculator = calculator;
        this._snapping = snapping;
        this._feedback = feedback;

        this.setupPointerObserver();
    }

    /**
     * Set callback for scale change events
     */
    setOnScaleChange(callback: (event: ResizeGizmoEvent) => void): void {
        this._onScaleChange = callback;
    }

    /**
     * Register WebXR controller
     */
    registerController(controller: WebXRInputSource): void {
        const id = controller.uniqueId;

        if (this._xrControllers.has(id)) {
            return;
        }

        this._xrControllers.set(id, controller);

        // Motion controller might not be initialized yet
        // Listen for motion controller initialization, then register grip handler
        const setupGripHandler = () => {
            const gripComponent = controller.motionController?.getComponent("xr-standard-squeeze");

            if (gripComponent) {
                const observer = gripComponent.onButtonStateChangedObservable.add((component) => {
                    if (component.changes.pressed) {
                        if (component.pressed) {
                            this.onGripPressed(controller);
                        } else {
                            this.onGripReleased(controller);
                        }
                    }
                });

                this._gripObservers.set(id, observer);
            }
        };

        // If motion controller already exists, set up handler immediately
        if (controller.motionController) {
            setupGripHandler();
        } else {
            // Otherwise, wait for motion controller to be initialized
            controller.onMotionControllerInitObservable.add(() => {
                setupGripHandler();
            });
        }
    }

    /**
     * Unregister WebXR controller
     */
    unregisterController(controller: WebXRInputSource): void {
        const id = controller.uniqueId;

        // Remove grip observer
        const observer = this._gripObservers.get(id);
        if (observer) {
            const gripComponent = controller.motionController?.getComponent("xr-standard-squeeze");
            gripComponent?.onButtonStateChangedObservable.remove(observer);
            this._gripObservers.delete(id);
        }

        this._xrControllers.delete(id);
    }

    /**
     * Setup pointer observer for hover detection
     * Note: This only detects main scene meshes, not utility layer meshes
     */
    private setupPointerObserver(): void {
        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                this.handlePointerMove(pointerInfo);
            }
        });
    }

    /**
     * Handle pointer movement (for hover detection)
     * Only detects target mesh hover - handles are detected via manual ray picking in update()
     */
    private handlePointerMove(pointerInfo: PointerInfo): void {
        // Only process when not actively scaling
        if (this._state.state === InteractionState.ACTIVE_SCALING) {
            return;
        }

        // Check for WebXR pointer
        const pickInfo = pointerInfo.pickInfo;
        if (!pickInfo) {
            return;
        }

        // Check if hovering over target mesh
        if (pickInfo.pickedMesh === this._state.targetMesh) {
            this.onMeshHovered(pickInfo.pickedMesh);
        }
    }

    /**
     * Check if WebXR pointer is hovering over a handle using manual ray picking
     * Must use manual picking because handles are in utility layer, not main scene
     * Returns handle info with pick result for intersection point
     */
    private getHandleUnderPointer(): HandlePickResult | undefined {
        // Get utility layer scene from visuals
        const utilityScene = this._visuals.getUtilityScene();

        // Iterate through registered XR controllers
        for (const controller of this._xrControllers.values()) {
            if (!controller.pointer) {
                continue;
            }

            // Use getWorldPointerRayToRef to get ray in world space
            // This is crucial when controllers are parented to a rig
            const ray = new Ray(Vector3.Zero(), Vector3.Forward(), 1000);
            controller.getWorldPointerRayToRef(ray);

            // Pick from utility layer scene
            const pickResult = utilityScene.pickWithRay(ray, (mesh) => {
                return mesh.id.includes('gizmo-handle');
            });

            if (pickResult && pickResult.hit && pickResult.pickedMesh) {
                // Check if picked mesh is one of our handles
                const handle = this._visuals.getHandleByMesh(pickResult.pickedMesh);
                if (handle) {
                    return {
                        handle,
                        pickInfo: pickResult,
                        controller
                    };
                }
            }
        }

        return undefined;
    }

    /**
     * Check if any XR controller pointer is inside the expanded handle boundary
     * Used to prevent hover state loss when pointer crosses whitespace between mesh and handles
     */
    private isPointerInsideHandleBoundary(): boolean {
        // Iterate through registered XR controllers
        for (const controller of this._xrControllers.values()) {
            if (!controller.pointer) {
                continue;
            }

            // Get controller ray in world space
            const ray = new Ray(Vector3.Zero(), Vector3.Forward(), 1000);
            controller.getWorldPointerRayToRef(ray);

            // Check if this ray intersects the handle boundary
            if (this._visuals.isPointerInsideHandleBoundary(ray)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle mesh hover
     */
    private onMeshHovered(mesh: AbstractMesh): void {
        if (this._state.state !== InteractionState.HOVER_MESH) {
            this._state.state = InteractionState.HOVER_MESH;
            // Visuals already attached via attach() method
        }
    }

    /**
     * Handle handle hover
     */
    private onHandleHovered(handlePickResult: HandlePickResult): void {
        const handle = handlePickResult.handle;

        // Update state
        if (this._state.hoveredHandle?.id !== handle.id) {
            // Unhighlight previous handle
            if (this._state.hoveredHandle) {
                this._visuals.unhighlightHandle(this._state.hoveredHandle.id);
            }

            // Highlight new handle
            this._visuals.highlightHandle(handle.id);
            this._state.hoveredHandle = handle;
            this._state.state = InteractionState.HOVER_HANDLE;
        }
    }

    /**
     * Handle hover exit
     */
    private onHoverExit(): void {
        if (this._state.hoveredHandle) {
            this._visuals.unhighlightHandle(this._state.hoveredHandle.id);
            this._state.hoveredHandle = undefined;
        }

        if (this._state.state !== InteractionState.ACTIVE_SCALING) {
            this._state.state = InteractionState.IDLE;
        }
    }

    /**
     * Handle grip button press
     */
    private onGripPressed(controller: WebXRInputSource): void {
        // Only start scaling if hovering over a handle
        if (this._state.state !== InteractionState.HOVER_HANDLE || !this._state.hoveredHandle || !this._state.targetMesh) {
            return;
        }

        // Do a fresh pick to get the intersection point on the handle
        const utilityScene = this._visuals.getUtilityScene();
        const ray = new Ray(Vector3.Zero(), Vector3.Forward(), 1000);
        controller.getWorldPointerRayToRef(ray);

        const pickResult = utilityScene.pickWithRay(ray, (mesh) => {
            return mesh.id.includes('gizmo-handle');
        });

        if (!pickResult || !pickResult.hit || !pickResult.pickedPoint) {
            // Failed to pick handle, abort
            return;
        }

        // Get controller position in WORLD SPACE
        const controllerPosition = controller.pointer.absolutePosition.clone();

        // Get intersection point on handle (world space)
        const intersectionPoint = pickResult.pickedPoint.clone();

        // Calculate "stick length" - fixed distance from controller to intersection point
        const stickLength = Vector3.Distance(controllerPosition, intersectionPoint);

        // Get mesh pivot point (scaling center) in world space
        // Meshes scale from their pivot/position, not from geometric bounding box center
        const boundingBoxCenter = this._state.targetMesh.absolutePosition.clone();

        // Initialize drag state
        this._state.state = InteractionState.ACTIVE_SCALING;
        this._state.activeHandle = this._state.hoveredHandle;
        this._state.startScale = this._state.targetMesh.scaling.clone();
        this._state.startPointerPosition = intersectionPoint; // Store intersection point as start
        this._state.currentPointerPosition = intersectionPoint;
        this._state.stickLength = stickLength;
        this._state.boundingBoxCenter = boundingBoxCenter;

        // Update visuals
        this._visuals.setHandleActive(this._state.activeHandle.id);

        // Show feedback
        if (this._state.targetMesh) {
            this._feedback.showGrid(this._state.targetMesh, this._state.activeHandle);
            this._feedback.showSnapIndicators(this._state.targetMesh, this._state.activeHandle);
            this._feedback.showNumericDisplay(this._state.targetMesh, this._state.startScale, this._state.startScale);
        }

        // Emit event
        this.emitScaleEvent(ResizeGizmoEventType.SCALE_START, this._state.startScale);

        // Apply haptic feedback
        if (this._config.current.hapticFeedback) {
            controller.motionController?.pulse(0.5, 100);
        }
    }

    /**
     * Handle grip button release
     */
    private onGripReleased(controller: WebXRInputSource): void {
        if (this._state.state !== InteractionState.ACTIVE_SCALING || !this._state.targetMesh) {
            return;
        }

        const finalScale = this._state.targetMesh.scaling.clone();

        // Hide feedback
        this._feedback.hideGrid();
        this._feedback.hideSnapIndicators();
        this._feedback.hideNumericDisplay();

        // Emit event
        this.emitScaleEvent(ResizeGizmoEventType.SCALE_END, finalScale, this._state.startScale);

        // Reset state
        this._state.state = InteractionState.HOVER_HANDLE;
        this._state.activeHandle = undefined;
        this._state.startScale = undefined;
        this._state.startPointerPosition = undefined;
        this._state.currentPointerPosition = undefined;
        this._state.stickLength = undefined;
        this._state.boundingBoxCenter = undefined;

        // Apply haptic feedback
        if (this._config.current.hapticFeedback) {
            controller.motionController?.pulse(0.3, 50);
        }
    }

    /**
     * Update during frame (called every frame)
     */
    update(): void {
        // Check for handle hover using manual ray picking (only when not actively scaling)
        if (this._state.state !== InteractionState.ACTIVE_SCALING) {
            const handlePickResult = this.getHandleUnderPointer();

            if (handlePickResult) {
                this.onHandleHovered(handlePickResult);
            } else if (this._state.hoveredHandle) {
                // Was hovering a handle, but not anymore
                // Check if still inside handle boundary before exiting hover (prevents loss in whitespace)
                const stillInsideBoundary = this.isPointerInsideHandleBoundary();

                if (stillInsideBoundary) {
                    // Keep gizmo active but unhighlight the specific handle
                    this._visuals.unhighlightHandle(this._state.hoveredHandle.id);
                    this._state.hoveredHandle = undefined;
                    // Keep state as HOVER_MESH (don't drop to IDLE)
                    this._state.state = InteractionState.HOVER_MESH;
                } else {
                    // Pointer left the boundary entirely, exit hover completely
                    this.onHoverExit();
                }
            }
        }

        // Only process scaling logic during active scaling
        if (this._state.state !== InteractionState.ACTIVE_SCALING) {
            return;
        }

        if (!this._state.targetMesh || !this._state.activeHandle || !this._state.startScale || !this._state.startPointerPosition || !this._state.stickLength || !this._state.boundingBoxCenter) {
            return;
        }

        // Get current virtual point from any active controller using "virtual stick"
        let currentVirtualPoint: Vector3 | undefined;

        for (const controller of this._xrControllers.values()) {
            // Check if this controller has grip pressed
            const gripComponent = controller.motionController?.getComponent("xr-standard-squeeze");
            if (gripComponent?.pressed) {
                // Get controller ray in world space
                const ray = new Ray(Vector3.Zero(), Vector3.Forward(), 1000);
                controller.getWorldPointerRayToRef(ray);

                // Calculate virtual point = controller origin + (ray direction × stick length)
                // This is the "end of the stick" that moves/rotates with the controller
                currentVirtualPoint = ray.origin.add(ray.direction.normalize().scale(this._state.stickLength));
                break;
            }
        }

        if (!currentVirtualPoint) {
            return;
        }

        this._state.currentPointerPosition = currentVirtualPoint;

        // Calculate new scale
        const newScale = this._calculator.calculateScale(
            this._state.targetMesh,
            this._state.activeHandle,
            this._state.startScale,
            this._state.startPointerPosition,
            currentVirtualPoint,
            this._state.boundingBoxCenter
        );

        // Apply scale to mesh
        this._state.targetMesh.scaling = newScale;

        // Update visuals
        this._visuals.update();
        this._feedback.showNumericDisplay(this._state.targetMesh, newScale, this._state.startScale);

        // Check for snap proximity (for haptic feedback)
        if (this._config.current.hapticFeedback && this._snapping.isEnabled()) {
            // Calculate snap proximity for each affected axis
            let maxProximity = 0;

            for (const axis of this._state.activeHandle.axes) {
                const scaleValue = axis === "X" ? newScale.x : axis === "Y" ? newScale.y : newScale.z;
                const snapDistance = this._config.getSnapDistance(axis);
                const proximity = this._snapping.calculateSnapProximity(scaleValue, snapDistance);
                maxProximity = Math.max(maxProximity, proximity);
            }

            // Trigger haptic pulse if close to snap point
            if (maxProximity > 0.9) {
                // Find active controller and pulse
                for (const controller of this._xrControllers.values()) {
                    const gripComponent = controller.motionController?.getComponent("xr-standard-squeeze");
                    if (gripComponent?.pressed) {
                        controller.motionController?.pulse(0.2, 20);
                        break;
                    }
                }
            }
        }

        // Emit event
        this.emitScaleEvent(ResizeGizmoEventType.SCALE_DRAG, newScale);
    }

    /**
     * Attach to a mesh
     */
    attach(mesh: AbstractMesh): void {
        this._state.targetMesh = mesh;
        this._state.state = InteractionState.IDLE;
    }

    /**
     * Detach from current mesh
     */
    detach(): void {
        // Stop any active scaling
        if (this._state.state === InteractionState.ACTIVE_SCALING) {
            this._feedback.hideGrid();
            this._feedback.hideSnapIndicators();
            this._feedback.hideNumericDisplay();
        }

        // Reset state
        this._state = {
            state: InteractionState.IDLE
        };
    }

    /**
     * Emit scale change event
     */
    private emitScaleEvent(type: ResizeGizmoEventType, scale: Vector3, previousScale?: Vector3): void {
        if (!this._onScaleChange || !this._state.targetMesh) {
            return;
        }

        const event: ResizeGizmoEvent = {
            type,
            mesh: this._state.targetMesh,
            scale: scale.clone(),
            previousScale: previousScale?.clone(),
            handle: this._state.activeHandle,
            timestamp: Date.now()
        };

        this._onScaleChange(event);
    }

    /**
     * Check if currently scaling
     */
    isScaling(): boolean {
        return this._state.state === InteractionState.ACTIVE_SCALING;
    }

    /**
     * Check if hovering over a handle (will handle grip press)
     */
    isHoveringHandle(): boolean {
        return this._state.state === InteractionState.HOVER_HANDLE && this._state.hoveredHandle != null;
    }

    /**
     * Get current interaction state (for external integration)
     */
    getState(): Readonly<GizmoInteractionState> {
        return this._state;
    }

    /**
     * Dispose
     */
    dispose(): void {
        // Remove pointer observer
        if (this._pointerObserver) {
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._pointerObserver = undefined;
        }

        // Unregister all controllers
        for (const controller of this._xrControllers.values()) {
            this.unregisterController(controller);
        }

        this._xrControllers.clear();
        this._gripObservers.clear();
    }
}

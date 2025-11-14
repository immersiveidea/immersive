/**
 * WebXR Resize Gizmo - Manager
 * Main orchestration class that manages the resize gizmo system
 */

import {
    Scene,
    AbstractMesh,
    Observable,
    WebXRInputSource
} from "@babylonjs/core";
import {
    ResizeGizmoMode,
    ResizeGizmoConfig,
    ResizeGizmoEvent,
    ResizeGizmoEventType,
    ResizeGizmoEventCallback,
    ResizeGizmoObserver
} from "./types";
import { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";
import { ResizeGizmoVisuals } from "./ResizeGizmoVisuals";
import { ResizeGizmoInteraction } from "./ResizeGizmoInteraction";
import { ScalingCalculator } from "./ScalingCalculator";
import { ResizeGizmoSnapping } from "./ResizeGizmoSnapping";
import { ResizeGizmoFeedback } from "./ResizeGizmoFeedback";

/**
 * Main manager class for the resize gizmo system
 *
 * @example
 * ```typescript
 * // Create gizmo manager
 * const gizmo = new ResizeGizmoManager(scene, {
 *     mode: ResizeGizmoMode.ALL,
 *     enableSnapping: true,
 *     snapDistanceX: 0.1
 * });
 *
 * // Attach to a mesh
 * gizmo.attachToMesh(myMesh);
 *
 * // Register WebXR controllers
 * xr.input.onControllerAddedObservable.add((controller) => {
 *     gizmo.registerController(controller);
 * });
 *
 * // Listen to scale events
 * gizmo.onScaleEnd((event) => {
 *     console.log("Final scale:", event.scale);
 * });
 *
 * // Update in render loop
 * scene.onBeforeRenderObservable.add(() => {
 *     gizmo.update();
 * });
 * ```
 */
export class ResizeGizmoManager {
    private _scene: Scene;
    private _config: ResizeGizmoConfigManager;

    // Subsystems
    private _visuals: ResizeGizmoVisuals;
    private _snapping: ResizeGizmoSnapping;
    private _calculator: ScalingCalculator;
    private _feedback: ResizeGizmoFeedback;
    private _interaction: ResizeGizmoInteraction;

    // Event system
    private _observable: Observable<ResizeGizmoEvent>;
    private _observers: ResizeGizmoObserver[] = [];

    // State
    private _attachedMesh?: AbstractMesh;
    private _enabled: boolean = true;

    constructor(scene: Scene, config?: Partial<ResizeGizmoConfig>) {
        this._scene = scene;
        this._config = new ResizeGizmoConfigManager(config);
        this._observable = new Observable<ResizeGizmoEvent>();

        // Initialize subsystems
        this._snapping = new ResizeGizmoSnapping(this._config);
        this._calculator = new ScalingCalculator(this._config, this._snapping);
        this._visuals = new ResizeGizmoVisuals(scene, this._config);
        this._feedback = new ResizeGizmoFeedback(scene, this._config, this._snapping);
        this._interaction = new ResizeGizmoInteraction(
            scene,
            this._config,
            this._visuals,
            this._calculator,
            this._snapping,
            this._feedback
        );

        // Wire up interaction events
        this._interaction.setOnScaleChange((event) => {
            this.emitEvent(event);
        });
    }

    /**
     * Attach gizmo to a mesh
     */
    attachToMesh(mesh: AbstractMesh): void {
        // Detach from previous mesh
        if (this._attachedMesh) {
            this.detachFromMesh();
        }

        this._attachedMesh = mesh;

        // Attach subsystems
        this._visuals.attach(mesh);
        this._interaction.attach(mesh);

        // Emit event
        this.emitEvent({
            type: ResizeGizmoEventType.ATTACHED,
            mesh,
            scale: mesh.scaling.clone(),
            timestamp: Date.now()
        });
    }

    /**
     * Detach from current mesh
     */
    detachFromMesh(): void {
        if (!this._attachedMesh) {
            return;
        }

        const mesh = this._attachedMesh;

        // Detach subsystems
        this._visuals.detach();
        this._interaction.detach();

        this._attachedMesh = undefined;

        // Emit event
        this.emitEvent({
            type: ResizeGizmoEventType.DETACHED,
            mesh,
            scale: mesh.scaling.clone(),
            timestamp: Date.now()
        });
    }

    /**
     * Register a WebXR controller
     */
    registerController(controller: WebXRInputSource): void {
        this._interaction.registerController(controller);
    }

    /**
     * Unregister a WebXR controller
     */
    unregisterController(controller: WebXRInputSource): void {
        this._interaction.unregisterController(controller);
    }

    /**
     * Update (call in render loop)
     */
    update(): void {
        if (!this._enabled || !this._attachedMesh) {
            return;
        }

        this._interaction.update();
    }

    /**
     * Set gizmo mode
     */
    setMode(mode: ResizeGizmoMode): void {
        this._config.setMode(mode);

        // Update visuals
        if (this._attachedMesh) {
            this._visuals.detach();
            this._visuals.attach(this._attachedMesh);
        }

        // Emit event
        if (this._attachedMesh) {
            this.emitEvent({
                type: ResizeGizmoEventType.MODE_CHANGED,
                mesh: this._attachedMesh,
                scale: this._attachedMesh.scaling.clone(),
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get current mode
     */
    getMode(): ResizeGizmoMode {
        return this._config.current.mode;
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ResizeGizmoConfig>): void {
        this._config.update(updates);

        // Refresh visuals if attached
        if (this._attachedMesh) {
            this._visuals.update();
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): Readonly<ResizeGizmoConfig> {
        return this._config.current;
    }

    /**
     * Enable/disable gizmo
     */
    setEnabled(enabled: boolean): void {
        this._enabled = enabled;
        this._visuals.setVisible(enabled);
    }

    /**
     * Check if enabled
     */
    isEnabled(): boolean {
        return this._enabled;
    }

    /**
     * Get attached mesh
     */
    getAttachedMesh(): AbstractMesh | undefined {
        return this._attachedMesh;
    }

    /**
     * Check if gizmo is currently being used (scaling in progress)
     */
    isScaling(): boolean {
        return this._interaction.isScaling();
    }

    /**
     * Check if hovering over a handle (will handle grip button press)
     */
    isHoveringHandle(): boolean {
        return this._interaction.isHoveringHandle();
    }

    /**
     * Get the utility layer scene (for filtering picks in main scene)
     * This is used to prevent pointer events on gizmo handles from leaking to main scene
     */
    getUtilityScene(): Scene {
        return this._visuals.getUtilityScene();
    }

    // ===== Event System =====

    /**
     * Register event listener for specific event type
     */
    on(eventType: ResizeGizmoEventType, callback: ResizeGizmoEventCallback): void {
        const observer = this._observable.add((event) => {
            if (event.type === eventType) {
                callback(event);
            }
        });

        this._observers.push({
            eventType,
            callback,
            observer
        });
    }

    /**
     * Remove event listener
     */
    off(eventType: ResizeGizmoEventType, callback: ResizeGizmoEventCallback): void {
        const index = this._observers.findIndex(
            (o) => o.eventType === eventType && o.callback === callback
        );

        if (index >= 0) {
            const observerInfo = this._observers[index];
            this._observable.remove(observerInfo.observer);
            this._observers.splice(index, 1);
        }
    }

    /**
     * Listen to scale start events
     */
    onScaleStart(callback: ResizeGizmoEventCallback): void {
        this.on(ResizeGizmoEventType.SCALE_START, callback);
    }

    /**
     * Listen to scale drag events
     */
    onScaleDrag(callback: ResizeGizmoEventCallback): void {
        this.on(ResizeGizmoEventType.SCALE_DRAG, callback);
    }

    /**
     * Listen to scale end events
     */
    onScaleEnd(callback: ResizeGizmoEventCallback): void {
        this.on(ResizeGizmoEventType.SCALE_END, callback);
    }

    /**
     * Listen to attach events
     */
    onAttached(callback: ResizeGizmoEventCallback): void {
        this.on(ResizeGizmoEventType.ATTACHED, callback);
    }

    /**
     * Listen to detach events
     */
    onDetached(callback: ResizeGizmoEventCallback): void {
        this.on(ResizeGizmoEventType.DETACHED, callback);
    }

    /**
     * Listen to mode change events
     */
    onModeChanged(callback: ResizeGizmoEventCallback): void {
        this.on(ResizeGizmoEventType.MODE_CHANGED, callback);
    }

    /**
     * Emit an event
     */
    private emitEvent(event: ResizeGizmoEvent): void {
        if (this._config.current.emitEvents) {
            this._observable.notifyObservers(event);
        }
    }

    /**
     * Dispose all resources
     */
    dispose(): void {
        // Detach from mesh
        if (this._attachedMesh) {
            this.detachFromMesh();
        }

        // Dispose subsystems
        this._interaction.dispose();
        this._feedback.dispose();
        this._visuals.dispose();

        // Clear observers
        this._observable.clear();
        this._observers = [];
    }
}

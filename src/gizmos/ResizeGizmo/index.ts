/**
 * WebXR Resize Gizmo
 * Self-contained, reusable resize gizmo system for BabylonJS with WebXR support
 *
 * @example Basic usage:
 * ```typescript
 * import { ResizeGizmoManager, ResizeGizmoMode } from './gizmos/ResizeGizmo';
 *
 * const gizmo = new ResizeGizmoManager(scene, {
 *     mode: ResizeGizmoMode.ALL,
 *     enableSnapping: true
 * });
 *
 * gizmo.attachToMesh(myMesh);
 *
 * xr.input.onControllerAddedObservable.add((controller) => {
 *     gizmo.registerController(controller);
 * });
 *
 * scene.onBeforeRenderObservable.add(() => {
 *     gizmo.update();
 * });
 * ```
 *
 * @example With event callbacks:
 * ```typescript
 * gizmo.onScaleEnd((event) => {
 *     console.log('New scale:', event.scale);
 *     // Persist changes, update UI, etc.
 * });
 * ```
 *
 * @note For DiagramEntity integration, see src/integration/gizmo/DiagramEntityAdapter
 */

// Main manager
export { ResizeGizmoManager } from "./ResizeGizmoManager";

// Configuration
export { ResizeGizmoConfigManager } from "./ResizeGizmoConfig";

// Types
export {
    ResizeGizmoMode,
    HandleType,
    InteractionState,
    ResizeGizmoEventType,
    ResizeGizmoConfig,
    ResizeGizmoEvent,
    ResizeGizmoEventCallback,
    HandlePosition,
    DEFAULT_RESIZE_GIZMO_CONFIG
} from "./types";

// Internal classes (exported for advanced usage)
export { ResizeGizmoVisuals } from "./ResizeGizmoVisuals";
export { ResizeGizmoInteraction } from "./ResizeGizmoInteraction";
export { ResizeGizmoSnapping } from "./ResizeGizmoSnapping";
export { ResizeGizmoFeedback } from "./ResizeGizmoFeedback";
export { ScalingCalculator } from "./ScalingCalculator";
export { HandleGeometry } from "./HandleGeometry";

/**
 * WebXR Resize Gizmo - Type Definitions
 * Self-contained resize gizmo system for BabylonJS with WebXR support
 */

import { Vector3, Color3, AbstractMesh, Observer } from "@babylonjs/core";

/**
 * Scaling mode determines which handles are visible and how scaling behaves
 */
export enum ResizeGizmoMode {
    /** Only face-center handles (6 handles) - scale single axis */
    SINGLE_AXIS = "SINGLE_AXIS",

    /** Only corner handles (8 handles) - uniform scaling all axes */
    UNIFORM = "UNIFORM",

    /** All handles enabled (14 total: 6 faces + 8 corners) - behavior depends on grabbed handle */
    ALL = "ALL"
}

/**
 * Type of handle being interacted with
 */
export enum HandleType {
    /** Corner handle - scales uniformly */
    CORNER = "CORNER",

    /** Edge handle - scales two axes */
    EDGE = "EDGE",

    /** Face handle - scales single axis */
    FACE = "FACE"
}

/**
 * Current state of gizmo interaction
 */
export enum InteractionState {
    /** No interaction */
    IDLE = "IDLE",

    /** Pointer hovering over target mesh */
    HOVER_MESH = "HOVER_MESH",

    /** Pointer hovering over a handle */
    HOVER_HANDLE = "HOVER_HANDLE",

    /** Actively scaling (grip button held) */
    ACTIVE_SCALING = "ACTIVE_SCALING"
}

/**
 * Events emitted by the resize gizmo
 */
export enum ResizeGizmoEventType {
    /** Scaling started (grip pressed on handle) */
    SCALE_START = "SCALE_START",

    /** Scaling in progress (during drag) */
    SCALE_DRAG = "SCALE_DRAG",

    /** Scaling ended (grip released) */
    SCALE_END = "SCALE_END",

    /** Gizmo attached to new mesh */
    ATTACHED = "ATTACHED",

    /** Gizmo detached from mesh */
    DETACHED = "DETACHED",

    /** Mode changed */
    MODE_CHANGED = "MODE_CHANGED"
}

/**
 * Handle position information
 */
export interface HandlePosition {
    /** World position of handle */
    position: Vector3;

    /** Type of handle */
    type: HandleType;

    /** Axes affected by this handle (e.g., ["X", "Y", "Z"] for uniform) */
    axes: ("X" | "Y" | "Z")[];

    /** Normal direction from center (for scaling calculation) */
    normal: Vector3;

    /** Unique identifier */
    id: string;
}

/**
 * Event data for resize gizmo events
 */
export interface ResizeGizmoEvent {
    /** Event type */
    type: ResizeGizmoEventType;

    /** Target mesh being scaled */
    mesh: AbstractMesh;

    /** Current scale values */
    scale: Vector3;

    /** Previous scale (for SCALE_END) */
    previousScale?: Vector3;

    /** Handle being used (if applicable) */
    handle?: HandlePosition;

    /** Timestamp */
    timestamp: number;
}

/**
 * Configuration for resize gizmo
 */
export interface ResizeGizmoConfig {
    // === Mode Configuration ===
    /** Scaling mode - determines which handles are shown */
    mode: ResizeGizmoMode;

    // === Handle Appearance ===
    /** Size of handle meshes as fraction of bounding box (e.g., 0.2 = 20% of avg bounding box dimension) */
    handleSize: number;

    /** Color for corner handles */
    cornerHandleColor: Color3;

    /** Color for edge handles */
    edgeHandleColor: Color3;

    /** Color for face handles */
    faceHandleColor: Color3;

    /** Color when handle is hovered */
    hoverColor: Color3;

    /** Color when handle is being dragged */
    activeColor: Color3;

    /** Scale factor applied to hovered handle (e.g., 1.2 = 20% larger) */
    hoverScaleFactor: number;

    // === Bounding Box ===
    /** Handle offset from bounding box surface (0.05 = 5% outward) */
    handleOffset: number;

    /** Padding for bounding box wireframe (0.03 = 3% outward breathing room) */
    wireframePadding: number;

    /** Bounding box wireframe color */
    boundingBoxColor: Color3;

    /** Bounding box wireframe transparency (0-1) */
    wireframeAlpha: number;

    /** Show bounding box only on hover */
    showBoundingBoxOnHoverOnly: boolean;

    /** Keep hover state when pointer is within handle boundary (prevents loss in whitespace) */
    keepHoverInHandleBoundary: boolean;

    // === Snapping ===
    /** Enable snap-to-grid during scaling */
    enableSnapping: boolean;

    /** Snap distance for X axis */
    snapDistanceX: number;

    /** Snap distance for Y axis */
    snapDistanceY: number;

    /** Snap distance for Z axis */
    snapDistanceZ: number;

    /** Show visual snap point indicators */
    showSnapIndicators: boolean;

    /** Enable haptic feedback on snap (WebXR only) */
    hapticFeedback: boolean;

    // === Visual Feedback ===
    /** Show numeric scale/dimension display */
    showNumericDisplay: boolean;

    /** Show alignment grid during scaling */
    showGrid: boolean;

    /** Show snap points along axes */
    showSnapPoints: boolean;

    /** Font size for numeric display */
    numericDisplayFontSize: number;

    // === Constraints ===
    /** Minimum scale values */
    minScale: Vector3;

    /** Maximum scale values (optional) */
    maxScale?: Vector3;

    /** Lock aspect ratio in TWO_AXIS mode */
    lockAspectRatio: boolean;

    /** Scale from center (true) or from opposite corner (false) */
    scaleFromCenter: boolean;

    // === Integration ===
    /** Use DiagramEntity integration for persistence */
    useDiagramEntity: boolean;

    /** DiagramManager instance (required if useDiagramEntity is true) */
    diagramManager?: any;

    /** Emit events on scale changes */
    emitEvents: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_RESIZE_GIZMO_CONFIG: ResizeGizmoConfig = {
    // Mode
    mode: ResizeGizmoMode.ALL,

    // Handle appearance (as fraction of bounding box size, e.g., 0.2 = 20%)
    handleSize: 0.2,
    cornerHandleColor: new Color3(0.3, 0.5, 1.0),    // Blue
    edgeHandleColor: new Color3(0.3, 1.0, 0.5),      // Green
    faceHandleColor: new Color3(1.0, 0.3, 0.3),      // Red
    hoverColor: new Color3(1.0, 1.0, 0.3),           // Yellow
    activeColor: new Color3(1.0, 0.6, 0.2),          // Orange
    hoverScaleFactor: 1.3,

    // Bounding box
    handleOffset: 0.05,
    wireframePadding: 0.03,
    boundingBoxColor: new Color3(1.0, 1.0, 1.0),     // White
    wireframeAlpha: 0.3,
    showBoundingBoxOnHoverOnly: false,
    keepHoverInHandleBoundary: true,

    // Snapping
    enableSnapping: true,
    snapDistanceX: 0.1,
    snapDistanceY: 0.1,
    snapDistanceZ: 0.1,
    showSnapIndicators: true,
    hapticFeedback: true,

    // Visual feedback
    showNumericDisplay: true,
    showGrid: true,
    showSnapPoints: true,
    numericDisplayFontSize: 24,

    // Constraints
    minScale: new Vector3(0.01, 0.01, 0.01),
    maxScale: undefined,
    lockAspectRatio: false,
    scaleFromCenter: true,

    // Integration
    useDiagramEntity: false,
    diagramManager: undefined,
    emitEvents: true
};

/**
 * Internal state for gizmo interaction
 */
export interface GizmoInteractionState {
    /** Current interaction state */
    state: InteractionState;

    /** Handle currently being hovered (if any) */
    hoveredHandle?: HandlePosition;

    /** Handle currently being dragged (if any) */
    activeHandle?: HandlePosition;

    /** Starting scale when drag began */
    startScale?: Vector3;

    /** Starting pointer position when drag began (world space) */
    startPointerPosition?: Vector3;

    /** Current pointer position during drag (world space) */
    currentPointerPosition?: Vector3;

    /** Mesh currently being scaled */
    targetMesh?: AbstractMesh;

    /** Fixed "stick length" from controller to intersection point at grip press */
    stickLength?: number;

    /** World-space center of bounding box at drag start */
    boundingBoxCenter?: Vector3;
}

/**
 * Callback type for gizmo events
 */
export type ResizeGizmoEventCallback = (event: ResizeGizmoEvent) => void;

/**
 * Observer info for cleanup
 */
export interface ResizeGizmoObserver {
    eventType: ResizeGizmoEventType;
    callback: ResizeGizmoEventCallback;
    observer: Observer<ResizeGizmoEvent>;
}

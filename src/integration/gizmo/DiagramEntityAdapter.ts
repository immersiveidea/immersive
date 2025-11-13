/**
 * DiagramEntity Integration Adapter for ResizeGizmo
 * Bridges ResizeGizmo events to DiagramManager's persistence system
 *
 * This adapter lives in the integration layer to keep the ResizeGizmo
 * system pure and reusable without diagram-specific dependencies.
 */

import { AbstractMesh } from "@babylonjs/core";
import { ResizeGizmoManager } from "../../gizmos/ResizeGizmo";
import { ResizeGizmoEvent } from "../../gizmos/ResizeGizmo";

/**
 * Type definitions for DiagramManager integration (loosely coupled)
 * These match the actual types in the codebase without importing them
 */

interface DiagramEntity {
    id?: string;
    template?: string;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    [key: string]: any;
}

enum DiagramEventType {
    MODIFY = "MODIFY"
}

interface DiagramEvent {
    type: DiagramEventType;
    entity: DiagramEntity;
}

enum DiagramEventObserverMask {
    TO_DB = 2,
    ALL = -1
}

interface DiagramEventNotifier {
    notifyObservers(event: DiagramEvent, mask?: number): void;
}

interface DiagramManager {
    onDiagramEventObservable: DiagramEventNotifier;
}

/**
 * Converter function type for transforming BabylonJS meshes to DiagramEntities
 */
export type MeshToEntityConverter = (mesh: AbstractMesh) => DiagramEntity;

/**
 * Adapter that connects ResizeGizmo to DiagramManager for persistence
 * Uses dependency injection to remain loosely coupled from diagram internals
 *
 * @example
 * ```typescript
 * import { DiagramEntityAdapter } from './integration/gizmo';
 * import { toDiagramEntity } from './diagram/functions/toDiagramEntity';
 *
 * // Create resize gizmo
 * const gizmo = new ResizeGizmoManager(scene, {
 *     mode: ResizeGizmoMode.ALL
 * });
 *
 * // Create adapter with injected converter
 * const adapter = new DiagramEntityAdapter(
 *     gizmo,
 *     diagramManager,
 *     toDiagramEntity,  // Injected dependency
 *     false             // Don't persist on drag
 * );
 *
 * // Now scale changes will automatically persist to database
 * gizmo.attachToMesh(myDiagramMesh);
 * ```
 */
export class DiagramEntityAdapter {
    private _gizmo: ResizeGizmoManager;
    private _diagramManager: DiagramManager;
    private _meshConverter: MeshToEntityConverter;
    private _persistOnDrag: boolean;

    /**
     * Create adapter
     * @param gizmo ResizeGizmoManager instance
     * @param diagramManager DiagramManager instance (or object with onDiagramEventObservable)
     * @param meshConverter Function to convert BabylonJS mesh to DiagramEntity (injected dependency)
     * @param persistOnDrag If true, persist on every drag update (can be expensive). If false, only persist on scale end.
     */
    constructor(
        gizmo: ResizeGizmoManager,
        diagramManager: DiagramManager,
        meshConverter: MeshToEntityConverter,
        persistOnDrag: boolean = false
    ) {
        this._gizmo = gizmo;
        this._diagramManager = diagramManager;
        this._meshConverter = meshConverter;
        this._persistOnDrag = persistOnDrag;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Persist on scale end (always)
        this._gizmo.onScaleEnd((event) => {
            this.persistScaleChange(event);
        });

        // Optionally persist on drag
        if (this._persistOnDrag) {
            this._gizmo.onScaleDrag((event) => {
                this.persistScaleChange(event);
            });
        }
    }

    /**
     * Persist scale change to DiagramManager
     */
    private persistScaleChange(event: ResizeGizmoEvent): void {
        const mesh = event.mesh;

        // Convert mesh to DiagramEntity using injected converter
        // This properly extracts color from material and all other properties
        const entity = this._meshConverter(mesh);

        // Notify DiagramManager
        this._diagramManager.onDiagramEventObservable.notifyObservers(
            {
                type: DiagramEventType.MODIFY,
                entity
            },
            DiagramEventObserverMask.TO_DB
        );
    }

    /**
     * Enable/disable drag persistence
     */
    setPersistOnDrag(enabled: boolean): void {
        if (this._persistOnDrag === enabled) {
            return;
        }

        this._persistOnDrag = enabled;

        // Re-setup listeners
        // Note: In a production implementation, you'd want to properly remove/add observers
        // For now, this is a simplified version
        console.warn("[DiagramEntityAdapter] Changing persistOnDrag at runtime may cause duplicate events");
    }

    /**
     * Get persist on drag setting
     */
    getPersistOnDrag(): boolean {
        return this._persistOnDrag;
    }
}

import {AbstractMesh, GizmoManager, IAxisScaleGizmo, Observable} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";
import {DiagramEvent, DiagramEventType} from "../diagram/types/diagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";

export class ScaleMenu2 {
    private readonly _gizmoManager: GizmoManager;
    private readonly _notifier: Observable<DiagramEvent>;

    constructor(notifier: Observable<DiagramEvent>) {
        this._notifier = notifier;
        this._gizmoManager = new GizmoManager(DefaultScene.Scene);
        this._gizmoManager.positionGizmoEnabled = false;
        this._gizmoManager.rotationGizmoEnabled = false;
        this._gizmoManager.scaleGizmoEnabled = true;
        this._gizmoManager.boundingBoxGizmoEnabled = false;
        this._gizmoManager.usePointerToAttachGizmos = false;
        configureGizmo(this._gizmoManager.gizmos.scaleGizmo.yGizmo);
        configureGizmo(this._gizmoManager.gizmos.scaleGizmo.xGizmo);
        configureGizmo(this._gizmoManager.gizmos.scaleGizmo.zGizmo);
        this._gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(() => {
            if (this.mesh.scaling.x < .01) {
                this.mesh.scaling.x = .01;
            }
            if (this.mesh.scaling.y < .01) {
                this.mesh.scaling.y = .01;
            }
            if (this.mesh.scaling.z < .01) {
                this.mesh.scaling.z = .01;
            }
            const entity = toDiagramEntity(this.mesh);
            this._notifier.notifyObservers({type: DiagramEventType.MODIFY, entity: entity});
        });

    }

    public get mesh() {
        return this._gizmoManager.attachedMesh;
    }

    public show(mesh: AbstractMesh) {
        this._gizmoManager.attachToMesh(mesh);
    }

    public hide() {
        this._gizmoManager.attachToMesh(null);
    }

}

function configureGizmo(gizmo: IAxisScaleGizmo) {
    gizmo.snapDistance = .1;
    gizmo.uniformScaling = false;
    gizmo.scaleRatio = 3;
    gizmo.sensitivity = 3;

}
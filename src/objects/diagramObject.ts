import {AbstractMesh, Scene} from "@babylonjs/core";
import {DiagramEntity} from "../diagram/types/diagramEntity";
import {buildMeshFromDiagramEntity} from "../diagram/functions/buildMeshFromDiagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";

type DiagramObjectOptionsType = {
    diagramEntity?: DiagramEntity,
    mesh?: AbstractMesh
}
export class DiagramObject {
    private _scene: Scene;

    constructor(scene: Scene, options?: DiagramObjectOptionsType) {
        this._scene = scene;
        if (options) {
            if (options.diagramEntity) {
                this.fromDiagramEntity(options.diagramEntity);
            }
            if (options.mesh) {
                this._mesh = options.mesh;
                this._diagramEntity = this.diagramEntity;
            }
        }
    }

    private _mesh: AbstractMesh;

    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    private _diagramEntity: DiagramEntity;

    public get diagramEntity(): DiagramEntity {
        if (!this._diagramEntity) {
            if (this._mesh) {
                this._diagramEntity = toDiagramEntity(this._mesh);
            }
        }
        return this._diagramEntity;
    }

    public fromDiagramEntity(entity: DiagramEntity): DiagramObject {
        this._diagramEntity = entity;
        this._mesh = buildMeshFromDiagramEntity(this._diagramEntity, this._scene);
        return this;
    }

    public dispose() {
        this._mesh.dispose(false, true);
        this._mesh = null;
        this._diagramEntity = null;
        this._scene = null;
    }
}
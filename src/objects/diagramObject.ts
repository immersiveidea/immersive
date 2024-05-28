import {AbstractActionManager, AbstractMesh, Mesh, Observer, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {DiagramEntity} from "../diagram/types/diagramEntity";
import {buildMeshFromDiagramEntity} from "../diagram/functions/buildMeshFromDiagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {v4 as uuidv4} from 'uuid';
import {createLabel} from "../diagram/functions/createLabel";

type DiagramObjectOptionsType = {
    diagramEntity?: DiagramEntity,
    mesh?: AbstractMesh,
    actionManager?: AbstractActionManager
}

export class DiagramObject {
    private _scene: Scene;
    private _from: string;
    private _to: string;
    private _observingStart: number;
    private _sceneObserver: Observer<Scene>;
    private _observer: Observer<AbstractMesh>;

    private _mesh: AbstractMesh;
    private _label: AbstractMesh;
    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    constructor(scene: Scene, options?: DiagramObjectOptionsType) {
        this._scene = scene;
        if (options) {
            if (options.diagramEntity) {
                if (!options.diagramEntity.id) {
                    options.diagramEntity.id = 'id' + uuidv4();
                }
                const myEntity = this.fromDiagramEntity(options.diagramEntity);
                if (!myEntity) {
                    return null;
                }
            }
            if (options.mesh) {
                this._mesh = options.mesh;
                this._diagramEntity = this.diagramEntity;
            }
            if (options.actionManager && this._mesh) {
                this._mesh.actionManager = options.actionManager;
            }
        }
    }

    private _baseTransform: TransformNode;

    private _diagramEntity: DiagramEntity;

    public get baseTransform() {
        return this._baseTransform;
    }

    public get diagramEntity(): DiagramEntity {
        if (this._mesh) {
            this._diagramEntity = toDiagramEntity(this._mesh);

        }
        return this._diagramEntity;
    }

    public set text(value: string) {
        if (this._label) {
            this._label.dispose();
        }
        this._label = createLabel(value);
        this._label.parent = this._baseTransform;
        this.updateLabelPosition();
    }

    public updateLabelPosition() {
        if (this._label) {
            this._mesh.computeWorldMatrix(true);
            this._mesh.refreshBoundingInfo();
            const top =
                this._mesh.getBoundingInfo().boundingBox.maximumWorld;
            const temp = new TransformNode("temp", this._scene);
            temp.position = top;
            temp.setParent(this._baseTransform);
            const y = temp.position.y;
            temp.dispose();
            this._label.position.y = y + .06;
            this._label.billboardMode = Mesh.BILLBOARDMODE_Y;
        }
    }

    public clone(): DiagramObject {
        const clone = new DiagramObject(this._scene, {actionManager: this._mesh.actionManager});
        const newEntity = {...this._diagramEntity};
        newEntity.id = 'id' + uuidv4();
        clone.fromDiagramEntity(this._diagramEntity);

        return clone;
    }

    public fromDiagramEntity(entity: DiagramEntity): DiagramObject {
        this._diagramEntity = entity;
        if (!this._mesh) {
            this._mesh = buildMeshFromDiagramEntity(this._diagramEntity, this._scene);
        }
        if (!this._mesh) {
            return null;
        }
        if (entity.from) {
            this._from = entity.from;
        }
        if (entity.to) {
            this._to = entity.to;
        }
        if (!this._baseTransform) {
            this._baseTransform = new TransformNode("base-" + this._mesh.id, this._scene);
        }

        if (this._from && this._to) {
            if (!this._sceneObserver) {
                this._observingStart = Date.now();
                this._sceneObserver = this._scene.onAfterRenderObservable.add(() => {
                    const fromMesh = this._scene.getMeshById(this._from);
                    const toMesh = this._scene.getMeshById(this._to);
                    if (fromMesh && toMesh) {
                        this.updateConnection(fromMesh, toMesh);
                    } else {
                        if (Date.now() - this._observingStart > 5000) {
                            this.dispose();
                        }
                    }
                }, -1, false, this);
            }
        } else {
            this._mesh.setParent(this._baseTransform);
            this._baseTransform.position = xyztovec(entity.position);
            this._baseTransform.rotation = xyztovec(entity.rotation);
            this._mesh.scaling = xyztovec(entity.scale);
            this._mesh.position = Vector3.Zero();
            this._mesh.rotation = Vector3.Zero();
        }

        if (entity.text) {
            this.text = entity.text;
        }
        return this;
    }

    public dispose() {
        this._scene.onAfterRenderObservable.remove(this._sceneObserver);
        this._sceneObserver = null;
        this._mesh?.dispose(false, true);
        this._mesh = null;
        this._label?.dispose();
        this._label = null;
        this._diagramEntity = null;
        this._scene = null;
    }

    private updateConnection(fromMesh: AbstractMesh, toMesh: AbstractMesh) {
        this._baseTransform.position = Vector3.Center(fromMesh.getAbsolutePosition().clone(), toMesh.getAbsolutePosition().clone());
        this._baseTransform.lookAt(toMesh.getAbsolutePosition());
        this._mesh.scaling.y = Vector3.Distance(fromMesh.getAbsolutePosition(), toMesh.getAbsolutePosition());
        if (!this._mesh.parent) {
            this._mesh.parent = this._baseTransform;
        }
        this._mesh.rotation.x = Math.PI / 2;
    }
}

function xyztovec(xyz: { x, y, z }): Vector3 {
    return new Vector3(xyz.x, xyz.y, xyz.z);
}
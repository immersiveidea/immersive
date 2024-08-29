import {
    AbstractActionManager,
    AbstractMesh,
    Curve3,
    GreasedLineMesh,
    InstancedMesh,
    Mesh,
    Observable,
    Observer,
    Ray,
    Scene,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import {buildMeshFromDiagramEntity} from "./functions/buildMeshFromDiagramEntity";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {v4 as uuidv4} from 'uuid';
import {createLabel} from "./functions/createLabel";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";
import log, {Logger} from "loglevel";
import {xyztovec} from "./functions/vectorConversion";

type DiagramObjectOptionsType = {
    diagramEntity?: DiagramEntity,
    mesh?: AbstractMesh,
    actionManager?: AbstractActionManager
}

export class DiagramObject {
    private readonly _logger: Logger = log.getLogger('DiagramObject');
    private _scene: Scene;
    public grabbed: boolean = false;
    private _from: string;
    private _to: string;
    private _observingStart: number;
    private _sceneObserver: Observer<Scene>;
    private _eventObservable: Observable<DiagramEvent>;
    private _label: AbstractMesh;
    private _labelBack: InstancedMesh;
    private _meshesPresent: boolean = false;
    private _positionHash: string;
    private _fromPosition: number = 0;
    private _toPosition: number = 0;
    private _disposed: boolean = false;
    private _fromMesh: AbstractMesh;
    private _toMesh: AbstractMesh;
    private _meshRemovedObserver: Observer<AbstractMesh>;

    constructor(scene: Scene, eventObservable: Observable<DiagramEvent>, options?: DiagramObjectOptionsType) {
        this._eventObservable = eventObservable;
        this._scene = scene;
        if (options) {
            this._logger.debug('DiagramObject constructor called with options', options);
            if (options.diagramEntity) {
                this._logger.debug('DiagramObject constructor called with diagramEntity', options);
                if (!options.diagramEntity.id) {
                    options.diagramEntity.id = 'id' + uuidv4();
                }
                const myEntity = this.fromDiagramEntity(options.diagramEntity);
                if (!myEntity) {
                    this._logger.warn('DiagramObject constructor called with invalid diagramEntity', options.diagramEntity);
                    this._valid = false;
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
        this._valid = true;
    }

    private _mesh: AbstractMesh;

    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    private _valid: boolean = false;

    public get valid(): boolean {
        return this._valid;
    }

    public static CreateObject(scene: Scene, eventObservable: Observable<DiagramEvent>, options: DiagramObjectOptionsType): DiagramObject {
        const newObj = new DiagramObject(scene, eventObservable, options);
        if (newObj.valid) {
            return newObj;
        } else {
            return null;
        }
    }

    private _baseTransform: TransformNode;

    private _diagramEntity: DiagramEntity;

    public get baseTransform() {
        return this._baseTransform;
    }

    public get isGrabbable() {
        return this._diagramEntity?.template !== '#connection-template';
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
        if (this._labelBack) {
            this._labelBack.dispose();
        }
        if (this._diagramEntity.text != value) {
            this._eventObservable.notifyObservers({
                type: DiagramEventType.MODIFY,
                entity: this._diagramEntity
            }, DiagramEventObserverMask.TO_DB);
        }
        this._diagramEntity.text = value;
        this._label = createLabel(value);
        this._label.parent = this._baseTransform;
        this._labelBack = new InstancedMesh('labelBack' + value, (this._label as Mesh));
        this._labelBack.parent = this._label;
        this._labelBack.metadata = {exportable: true};
        this.updateLabelPosition();


    }

    public updateLabelPosition() {
        if (this._label) {
            this._mesh.computeWorldMatrix(true);
            this._mesh.refreshBoundingInfo({});
            if (this._from && this._to) {
                //this._label.position.x = .06;
                //this._label.position.z = .06;
                this._label.position.y = .05;
                this._label.rotation.y = Math.PI / 2;
                this._labelBack.rotation.y = Math.PI;
                this._labelBack.position.z = 0.001
                //this._label.billboardMode = Mesh.BILLBOARDMODE_Y;
                //this._label.billboardMode = Mesh.BILLBOARDMODE_Y;

            } else {
                const top =
                    this._mesh.getBoundingInfo().boundingBox.maximumWorld;
                const temp = new TransformNode("temp", this._scene);
                temp.position = top;
                temp.setParent(this._baseTransform);
                const y = temp.position.y;
                temp.dispose();
                this._label.position.y = y + .06;
                //this._labelBack.position.y = y + .06;
                this._labelBack.rotation.y = Math.PI;
                this._labelBack.position.z = 0.001
                //this._label.billboardMode = Mesh.BILLBOARDMODE_Y;
            }
        }
    }

    public clone(): DiagramObject {
        const clone = new DiagramObject(this._scene, this._eventObservable, {actionManager: this._mesh.actionManager});
        const oldEntity = this._diagramEntity;
        const newEntity: DiagramEntity = {
            id: 'id' + uuidv4(),
            position: oldEntity.position,
            rotation: oldEntity.rotation,
            scale: oldEntity.scale,
            type: 'entity',
            image: oldEntity.image,
            template: oldEntity.template,
            color: oldEntity.color,
            text: oldEntity.text
        };
        this._logger.debug('DiagramObject clone called', clone, this._diagramEntity, newEntity);
        return clone.fromDiagramEntity(newEntity);
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
            this._baseTransform.metadata = {exportable: true};
        }
        if (this._from && this._to) {
            if (!this._meshRemovedObserver) {
                this._meshRemovedObserver = this._scene.onMeshRemovedObservable.add((mesh) => {
                    if (mesh && mesh.id) {
                        switch (mesh.id) {
                            case this._from:
                                this._fromMesh = null;
                                this._meshesPresent = false;
                                this._eventObservable.notifyObservers({
                                    type: DiagramEventType.REMOVE,
                                    entity: this._diagramEntity
                                }, DiagramEventObserverMask.ALL);
                                this.dispose();
                                break;
                            case this._to:
                                this._toMesh = null;
                                this._meshesPresent = false;
                                this._eventObservable.notifyObservers({
                                    type: DiagramEventType.REMOVE,
                                    entity: this._diagramEntity
                                }, DiagramEventObserverMask.ALL);
                                this.dispose();
                        }
                    }


                }, -1, false, this);
            }
            if (!this._sceneObserver) {
                this._observingStart = Date.now();
                let tick = 0;
                this._sceneObserver = this._scene.onAfterRenderObservable.add(() => {

                    tick++;
                    if (tick % 3 === 0) {
                        if (this._meshesPresent) {
                            this.updateConnection();
                        } else {
                            this._fromMesh = this._fromMesh || this._scene.getMeshById(this._from);
                            this._toMesh = this._toMesh || this._scene.getMeshById(this._to);
                            if (this._fromMesh && this._toMesh) {
                                this.updateConnection();
                                this._meshesPresent = true;
                            } else {
                                if (Date.now() - this._observingStart > 5000) {
                                    this._logger.warn('DiagramObject connection timeout for: ', this._from, this._to, ' removing');
                                    this._eventObservable.notifyObservers({
                                        type: DiagramEventType.REMOVE,
                                        entity: this._diagramEntity
                                    }, DiagramEventObserverMask.ALL);
                                    this.dispose();

                                }
                            }
                        }
                    }
                }, -1, false, this);
            }
        } else {
            this._mesh.setParent(this._baseTransform);
            if (entity.position) {
                this._baseTransform.position = xyztovec(entity.position)
            }
            ;
            if (entity.rotation) {
                this._baseTransform.rotation = xyztovec(entity.rotation)
            }
            ;
            if (entity.scale) {
                this._mesh.scaling = xyztovec(entity.scale)
            }
            ;
            this._mesh.position = Vector3.Zero();
            this._mesh.rotation = Vector3.Zero();
        }

        if (entity.text) {
            this.text = entity.text;
        }
        return this;
    }

    public dispose() {
        if (this._disposed) {
            this._logger.warn('DiagramObject dispose called for ', this._diagramEntity?.id, ' but it is already disposed');
            return;
        }
        this._logger.debug('DiagramObject dispose called for ', this._diagramEntity?.id)
        this._scene?.onAfterRenderObservable.remove(this._sceneObserver);
        this._sceneObserver = null;
        this._mesh?.setParent(null);
        this._mesh?.dispose(true, false);
        this._mesh = null;
        this._label?.dispose(false, true);
        this._label = null;
        this._baseTransform?.dispose(false);
        this._diagramEntity = null;
        this._scene = null;
        this._fromMesh = null;
        this._toMesh = null;
        this._scene?.onMeshRemovedObservable.remove(this._meshRemovedObserver);
        this._disposed = true;
    }

    private updateConnection() {
        if (this._toMesh.absolutePosition.length() == this._toPosition && this._fromMesh.absolutePosition.length() == this._fromPosition) {
            return;
        }
        const curve: GreasedLineMesh = ((this._mesh as unknown) as GreasedLineMesh);
        const ray = new Ray(this._fromMesh.getAbsolutePosition(), Vector3.Normalize(this._toMesh.getAbsolutePosition().subtract(this._fromMesh.getAbsolutePosition())));
        const hit = this._scene.multiPickWithRay(ray, (mesh) => {
            if (mesh.id === this._to || mesh.id === this._from) {
                return true;
            } else {
                return false;
            }
        });
        if (hit[0].pickedMesh.id === this._to) {
            hit.reverse();
        }
        const distance = Math.abs(hit[0].pickedPoint.subtract(hit[1].pickedPoint).length());
        const fromNormal = hit[0].pickedMesh.getFacetNormal(hit[0].faceId);
        const toNormal = hit[1].pickedMesh.getFacetNormal(hit[1].faceId);

        const c = Curve3.CreateCubicBezier(hit[0].pickedPoint, hit[0].pickedPoint.add(fromNormal.normalize().scale(.21 * distance)),
            hit[1].pickedPoint.add(toNormal.normalize().scale(.21 * distance)),
            hit[1].pickedPoint, 40);
        const p = c.getPoints().flatMap((point) => {
            return point.asArray()
        })
        curve.setParent(null);
        curve.setPoints([p]);
        this._baseTransform.position = c.getPoints()[Math.floor(c.getPoints().length / 2)];
        this._toPosition = this._toMesh.absolutePosition.length();
        this._fromPosition = this._fromMesh.absolutePosition.length();
        curve.setParent(this._baseTransform);
        curve.setEnabled(true);
    }
}
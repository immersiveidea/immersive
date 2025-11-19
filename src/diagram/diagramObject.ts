import {
    AbstractActionManager,
    AbstractMesh,
    Color3,
    Curve3,
    GreasedLineMesh,
    InstancedMesh,
    Mesh,
    Observable,
    Observer,
    Ray,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {DiagramEntity, DiagramEntityType, DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import {buildMeshFromDiagramEntity} from "./functions/buildMeshFromDiagramEntity";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {v4 as uuidv4} from 'uuid';
import {createLabel} from "./functions/createLabel";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";
import log, {Logger} from "loglevel";
import {xyztovec} from "./functions/vectorConversion";
import {AnimatedLineTexture} from "../util/animatedLineTexture";
import {getToolboxColors} from "../toolbox/toolbox";
import {findClosestColor} from "../util/functions/findClosestColor";
import {appConfigInstance} from "../util/appConfig";

/**
 * Converts a Color3 to a hex color string
 * @param color - BabylonJS Color3
 * @returns Hex color string (e.g., '#ff0000')
 */
function color3ToHex(color: Color3): string {
    const r = Math.floor(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.floor(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.floor(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

type DiagramObjectOptionsType = {
    diagramEntity?: DiagramEntity,
    mesh?: AbstractMesh,
    actionManager?: AbstractActionManager
}

export class DiagramObject {
    private readonly _logger: Logger = log.getLogger('DiagramObject');
    private _group: TransformNode;
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
    private _disposed: boolean = false;
    private _fromMesh: AbstractMesh;
    private _toMesh: AbstractMesh;
    private _meshRemovedObserver: Observer<AbstractMesh>;
    private _configObserver: Observer<any>;
    // Position caching for connection optimization
    private _lastFromPosition: Vector3 = null;
    private _lastToPosition: Vector3 = null;
    private _positionTolerance: number = 0.001;

    constructor(scene: Scene, eventObservable: Observable<DiagramEvent>, options?: DiagramObjectOptionsType) {
        this._eventObservable = eventObservable;
        this._scene = scene;

        // Subscribe to config changes to update label rendering mode
        this._configObserver = appConfigInstance.onConfigChangedObservable.add(() => {
            this.updateLabelRenderingMode();
        });

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
        this.updateLabelRenderingMode();
    }

    private updateLabelRenderingMode() {
        if (!this._label) {
            return;
        }

        const mode = appConfigInstance.current.labelRenderingMode || 'billboard';

        // Reset billboard mode first
        this._label.billboardMode = Mesh.BILLBOARDMODE_NONE;
        if (this._labelBack) {
            this._labelBack.billboardMode = Mesh.BILLBOARDMODE_NONE;
        }

        switch (mode) {
            case 'billboard':
                // Billboard mode - labels always face camera (Y-axis only to prevent tilting)
                this._label.billboardMode = Mesh.BILLBOARDMODE_Y;
                if (this._labelBack) {
                    this._labelBack.billboardMode = Mesh.BILLBOARDMODE_Y;
                }
                break;
            case 'fixed':
                // Fixed mode - no billboard (default state, already set above)
                break;
            case 'dynamic':
                // Dynamic mode - to be implemented in future
                // TODO: Implement screen-space positioning
                this._logger.warn('Dynamic label rendering mode not yet implemented');
                break;
            case 'distance':
                // Distance-based mode - to be implemented in future
                // TODO: Implement distance-based offset
                this._logger.warn('Distance-based label rendering mode not yet implemented');
                break;
        }
    }

    public updateLabelPosition() {
        if (this._label) {
            this._mesh.computeWorldMatrix(true);
            this._mesh.refreshBoundingInfo({});

            if (this._from && this._to) {
                // Connection labels (arrows/lines)
                this._label.position.y = .05;
                this._label.rotation.y = Math.PI / 2;
                this._labelBack.rotation.y = Math.PI;
                this._labelBack.position.z = 0.001;
            } else {
                // Standard object labels - convert world space to parent's local space
                // This accounts for mesh scaling, which is not included in boundingBox.maximum
                const top = this._mesh.getBoundingInfo().boundingBox.maximumWorld;
                const temp = new TransformNode("temp", this._scene);
                temp.position = top;
                temp.setParent(this._baseTransform);
                const y = temp.position.y;
                temp.dispose();
                this._label.position.y = y + 0.06;
                this._labelBack.rotation.y = Math.PI;
                this._labelBack.position.z = 0.001;
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
            type: DiagramEntityType.ENTITY,
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
                                this._lastFromPosition = null;
                                this._meshesPresent = false;
                                this._eventObservable.notifyObservers({
                                    type: DiagramEventType.REMOVE,
                                    entity: this._diagramEntity
                                }, DiagramEventObserverMask.ALL);
                                this.dispose();
                                break;
                            case this._to:
                                this._toMesh = null;
                                this._lastToPosition = null;
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
                                // Reset cache to force initial update
                                this._lastFromPosition = null;
                                this._lastToPosition = null;
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
        appConfigInstance?.onConfigChangedObservable.remove(this._configObserver);
        this._configObserver = null;
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
        this._lastFromPosition = null;
        this._lastToPosition = null;
        this._scene?.onMeshRemovedObservable.remove(this._meshRemovedObserver);
        this._disposed = true;
    }

    private hasConnectionMoved(): boolean {
        if (!this._fromMesh || !this._toMesh) {
            return false;
        }

        const currentFromPos = this._fromMesh.getAbsolutePosition();
        const currentToPos = this._toMesh.getAbsolutePosition();

        // First update - always consider it moved
        if (this._lastFromPosition === null || this._lastToPosition === null) {
            return true;
        }

        // Check if either endpoint has moved beyond tolerance
        const fromMoved = Vector3.DistanceSquared(currentFromPos, this._lastFromPosition) >
                         (this._positionTolerance * this._positionTolerance);
        const toMoved = Vector3.DistanceSquared(currentToPos, this._lastToPosition) >
                       (this._positionTolerance * this._positionTolerance);

        return fromMoved || toMoved;
    }

    private updateConnection() {
        // Early exit if positions haven't changed
        if (!this.hasConnectionMoved()) {
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
        if (!hit || hit.length < 2) {
            return; // No valid intersection found, skip update
        }
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

        // Update connection texture color to match the "from" mesh using toolbox color
        let hexColor: string | null = null;

        // Extract color using same priority system as toDiagramEntity
        if (this._fromMesh.metadata?.color) {
            // Priority 1: Explicit metadata color (most reliable)
            hexColor = this._fromMesh.metadata.color;
        } else if (this._fromMesh instanceof InstancedMesh && this._fromMesh.sourceMesh?.id) {
            // Priority 2: Extract from tool mesh ID (e.g., "tool-#box-template-#FF0000")
            const toolId = this._fromMesh.sourceMesh.id;
            const parts = toolId.split('-');
            if (parts.length >= 3 && parts[0] === 'tool') {
                const color = parts.slice(2).join('-'); // Handle colors with dashes
                if (color.startsWith('#')) {
                    hexColor = color.toLowerCase(); // Normalize to lowercase
                }
            }
        } else {
            // Priority 3: Fallback to material extraction
            const fromMaterial = this._fromMesh.material as StandardMaterial;
            if (fromMaterial) {
                const fromColor = fromMaterial.diffuseColor || fromMaterial.emissiveColor || Color3.White();
                hexColor = color3ToHex(fromColor);
            }
        }

        if (hexColor) {
            // Find the closest toolbox color
            const availableColors = getToolboxColors();
            const closestColor = findClosestColor(hexColor, availableColors);

            // Get or create material
            const material = curve.material as StandardMaterial;
            if (material) {

                // Check if we need to update the texture color
                // Don't dispose cached textures - they're shared across connections!
                const currentTextureName = material.emissiveTexture?.name || '';
                const needsColorUpdate = !material.emissiveTexture ||
                                        !currentTextureName.endsWith(closestColor);

                if (needsColorUpdate) {
                    // Get cached texture for the new color (creates if needed)
                    const coloredTexture = AnimatedLineTexture.CreateColoredTexture(closestColor);
                    material.emissiveTexture = coloredTexture;
                    material.opacityTexture = coloredTexture;
                }
                // If color matches, keep existing texture reference (already correct)
            }
        }

        // Update cached positions after successful update
        this._lastFromPosition = this._fromMesh.getAbsolutePosition().clone();
        this._lastToPosition = this._toMesh.getAbsolutePosition().clone();

        curve.setParent(this._baseTransform);
        curve.setEnabled(true);
    }
}
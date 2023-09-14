import {
    AbstractMesh,
    Color3,
    MeshBuilder,
    PointerInfo,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import log, {Logger} from "loglevel";


export class DiagramConnection {
    private logger: Logger = log.getLogger('DiagramConnection');

    constructor(from: string, to: string, scene?: Scene, pointerInfo?: PointerInfo) {
        this.logger.debug('buildConnection constructor');
        this.scene = scene;
        this._to = to;
        this._from = from;
        const fromMesh = this.scene.getMeshById(from);
        if (fromMesh) {
            this.fromAnchor = fromMesh;
        }

        const toMesh = this.scene.getMeshById(to);
        if (toMesh) {
            this.toAnchor = toMesh;
        } else {
            if (fromMesh) {
                const to = new TransformNode(this.id + "_to", this.scene);
                to.ignoreNonUniformScaling = true;
                to.id = this.id + "_to";
                to.position = fromMesh.absolutePosition.clone();
                if (pointerInfo) {
                    to.setParent(pointerInfo.pickInfo.gripTransform);
                }

                this.toAnchor = to;
            }
        }
        this.buildConnection();
    }

    private scene: Scene;
    private toAnchor: TransformNode;
    private fromAnchor: TransformNode;
    private transformNode: TransformNode;
    private points: Vector3[] = [];

    private _mesh: AbstractMesh;

    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    private readonly _to: string;

    public get to(): string {
        return this?.toAnchor?.id;
    }

    public set to(value: string) {
        if (!value) {
            return;
        }
        const toAnchor = this.scene.getMeshById(value);
        if (this.fromAnchor && toAnchor) {
            this.toAnchor.dispose();
            this.toAnchor = toAnchor;
            this._mesh.metadata.to = this.to;
            this._mesh.metadata.exportable = true;
            this._mesh.id = this.id;
            this.recalculate();
            this.setPoints();
        }
    }

    private readonly _from: string;

    public get from(): string {
        return this?.fromAnchor?.id;
    }

    public get id(): string {
        return "connection_" + this._from + "_" + this._to;
    }
    private tick: number = 0;
    private recalculate() {
        const start = this.fromAnchor?.absolutePosition;
        const end = this.toAnchor?.absolutePosition;
        if (start && end) {
            this.transformNode.position = start.add(end).scale(.5);
            this.transformNode.lookAt(end);
            this._mesh.rotation.x = Math.PI / 2;
            this._mesh.scaling.y = Math.abs(start.subtract(end).length());
        }

        /*if (this.fromAnchor && this.toAnchor) {
            this.points = [this.fromAnchor.absolutePosition, this.toAnchor.absolutePosition];
        } else {
            this.points = [Vector3.Zero(), Vector3.Zero()];
        }*/

    }

    private setPoints() {
        if (this.points.length > 1) {
            //this._mesh.setPoints([GreasedLineTools.ToNumberArray(this.points)]);
        }

    }

    private buildConnection() {
        this.logger.debug(`buildConnection from ${this._from} to ${this._to}`);
        this._mesh = MeshBuilder.CreateCylinder(this.id + "_cylinder", {diameter: .02, height: 1}, this.scene);
        const material = new StandardMaterial(this.id + "_material", this.scene);
        material.diffuseColor = new Color3(0, 0, 0);
        this._mesh.material = material;
        this.transformNode = new TransformNode(this.id + "_transform", this.scene);
        this._mesh.setParent(this.transformNode);
        this.recalculate();
        this._mesh.id = this.id;
        if (!this._mesh.metadata) {
            this._mesh.metadata = {template: "#connection-template", from: this._from};
        } else {
            this._mesh.metadata.template = "#connection-template";
            this._mesh.metadata.from = this._from;
        }
        if (this._to) {
            this.mesh.metadata.to = this.to;
        }
        this.setPoints();
        this.scene.onBeforeRenderObservable.add(this.beforeRender, -1, true, this);
        this.scene.onNewMeshAddedObservable.add(this.onMeshAdded, -1, true, this);
        this.mesh.onDisposeObservable.add(this.removeConnection, -1, true, this);
        return;
    }

    private beforeRender = () => {
        this.tick++;
        if (this.tick % 10 == 0) {
            this.recalculate();
            this.setPoints();
        }
    }
    private removeConnection = () => {
        this.logger.debug("removeConnection");
        this.scene.onBeforeRenderObservable.removeCallback(this.beforeRender);
        this._mesh.onDisposeObservable.removeCallback(this.removeConnection);

        this.removeObserver();
        if (this.toAnchor) {
            this.toAnchor = null;
        }
        if (this.fromAnchor) {
            this.fromAnchor = null;
        }
        if (this._mesh) {
            this._mesh.dispose();
            this._mesh = null;
        }
        if (this.scene) {
            this.scene = null;
        }
        if (this.logger) {
            this.logger = null;
        }
    }
    private onMeshAdded = (mesh: AbstractMesh) => {
        if (mesh && mesh.id) {
            if (!this.toAnchor || !this.fromAnchor) {
                if (mesh?.id == this?._to) {
                    this.logger.debug("Found to anchor");
                    this.toAnchor = mesh;
                    this._mesh.metadata.to = this.to;
                }
                if (mesh?.id == this?._from) {
                    this.logger.debug("Found from anchor");
                    this.fromAnchor = mesh;
                    this._mesh.metadata.from = this.from;
                }
                if (this.toAnchor && this.fromAnchor) {
                    this.logger.debug(`connection built from ${this._from} to ${this._to}`);
                    this.removeObserver();
                }
            }
        }
    }

    private removeObserver() {
        this.logger.debug("removing observer");
        this.scene.onNewMeshAddedObservable.removeCallback(this.onMeshAdded);
    }
}

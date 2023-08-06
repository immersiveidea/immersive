import {
    AbstractMesh,
    Color3,
    CreateGreasedLine,
    GreasedLineMesh,
    GreasedLineTools,
    PointerInfo,
    Scene,
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
                this.toAnchor = new TransformNode(this.id + "_to", this.scene);
                this.toAnchor.id = this.id + "_to";
                this.toAnchor.position = fromMesh.absolutePosition.clone();
                if (pointerInfo) {
                    this.toAnchor.setParent(pointerInfo.pickInfo.gripTransform);
                }
            }
        }
        this.buildConnection();
    }

    private scene: Scene;
    private toAnchor: TransformNode;
    private fromAnchor: TransformNode;
    private points: Vector3[] = [];

    private _mesh: GreasedLineMesh;

    public get mesh(): GreasedLineMesh {
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
        return "connection_" + this?.fromAnchor?.id + "_" + this?.toAnchor?.id;
    }

    private recalculate() {
        if (this.fromAnchor && this.toAnchor) {
            this.points = [this.fromAnchor.absolutePosition, this.toAnchor.absolutePosition];
        } else {
            this.points = [Vector3.Zero(), Vector3.Zero()];
        }
    }

    private setPoints() {
        if (this.points.length > 1) {
            this._mesh.setPoints([GreasedLineTools.ToNumberArray(this.points)]);
        }

    }

    private buildConnection() {
        this.logger.debug(`buildConnection from ${this._from} to ${this._to}`);

        this.recalculate();
        this._mesh = CreateGreasedLine(this.id,
            {
                points: (GreasedLineTools.ToNumberArray(this.points) as number[]),
                updatable: true
            }, {color: Color3.Black()}, this.scene);
        this._mesh.intersectionThreshold = 10;
        this.logger.debug(this._mesh.widths);
        this._mesh.widths = [0.1, 0.1, .1, .1];

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
        this.recalculate();
        this.setPoints();
    }
    private removeConnection = () => {
        this.logger.debug("removeConnection");
        this.scene.onBeforeRenderObservable.removeCallback(this.beforeRender);
        this.removeObserver();
        if (this.toAnchor) {
            this.toAnchor = null;
        }
        if (this.fromAnchor) {
            this.fromAnchor = null;
        }
        if (this._mesh) {
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

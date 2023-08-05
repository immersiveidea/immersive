import {
    AbstractMesh,
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

    private readonly scene: Scene;
    private toAnchor: TransformNode;
    private fromAnchor: TransformNode;
    private points: Vector3[] = [];

    private _mesh: GreasedLineMesh;

    public get mesh(): GreasedLineMesh {
        return this._mesh;
    }

    private _to: string;

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

    private _from: string;

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
            {points: (GreasedLineTools.ToNumberArray(this.points) as number[]), updatable: true}, null, this.scene);
        this._mesh.id = this.id;
        if (!this._mesh.metadata) {
            this._mesh.metadata = {template: "#connection-template", from: this._from};
        }
        if (this._to) {
            this.mesh.metadata.to = this.to;
        }
        this.setPoints();
        this.scene.onBeforeRenderObservable.add(() => {
            this.recalculate();
            this.setPoints();
        });
        this.scene.onNewMeshAddedObservable.add(this.onMeshAdded, -1, true, this);
        return;
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

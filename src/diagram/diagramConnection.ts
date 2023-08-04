import {
    CreateGreasedLine,
    GreasedLineMesh,
    GreasedLineTools,
    PointerInfo,
    Scene,
    TransformNode,
    Vector3
} from "@babylonjs/core";

export class DiagramConnection {
    private mesh: GreasedLineMesh;
    private readonly scene: Scene;
    private toAnchor: TransformNode;
    private fromAnchor: TransformNode;
    private pointerInfo: PointerInfo;
    private points: Vector3[] = [];

    constructor(from: string, to: string, id: string, scene: Scene, pointerInfo: PointerInfo) {
        this._from = from;
        this._to = to;
        this._id = id;
        this.scene = scene;
        this.pointerInfo = pointerInfo;

        if (from) {
            const fromMesh = this.scene.getMeshById(from);
            if (fromMesh) {
                this.fromAnchor = fromMesh;
                this.toAnchor = new TransformNode("toAnchor", this.scene);
                this.toAnchor.position = fromMesh.absolutePosition.clone();
                this.toAnchor.setParent(pointerInfo.pickInfo.gripTransform);

                this.buildConnection();
            }

        }
    }

    public _from: string;

    public get from(): string {
        return this._from;
    }

    public set from(value: string) {
        this._from = value;
    }

    public _to: string;

    public get to(): string {
        return this._to;
    }

    public set to(value: string) {
        if (!value) {
            return;
        }
        const toMesh = this.scene.getMeshById(value);
        if (toMesh) {
            const toAnchor = this.toAnchor;
            this.toAnchor = toMesh;
            toAnchor.dispose();
            this.recalculate();
            this.setPoints();
            this._to = value;
        }
    }

    public _id: string;

    public get id(): string {
        return this._id;
    }

    private recalculate() {
        //this.fromAnchor.computeWorldMatrix(true);
        //this.toAnchor.computeWorldMatrix(true);
        this.points = [this.fromAnchor.absolutePosition, this.toAnchor.absolutePosition];
    }

    private setPoints() {
        this.mesh.setPoints([GreasedLineTools.ToNumberArray(this.points)]);
    }

    private buildConnection() {

        this.recalculate();

        this.mesh = CreateGreasedLine("connection",
            {points: (GreasedLineTools.ToNumberArray(this.points) as number[]), updatable: true}, null, this.scene);

        this.setPoints();
        this.scene.onBeforeRenderObservable.add(() => {
            this.recalculate();
            this.setPoints();
        });

        //this.mesh.outlineColor = new Color3(0.5, 0.5, 1);
    }
}
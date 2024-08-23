import {
    AbstractMesh,
    LinesMesh,
    MeshBuilder,
    Observable,
    Observer,
    Ray,
    Scene,
    TransformNode,
    Vector3,
    WebXRInputSource
} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";
import {DiagramEvent, DiagramEventType, DiagramTemplates} from "../diagram/types/diagramEntity";
import {DiagramEventObserverMask} from "../diagram/types/diagramEventObserverMask";

export class ConnectionPreview {
    private _fromPoint: Vector3;
    private _fromId: string;
    private _renderObserver: Observer<Scene>;
    private _line: LinesMesh;
    private _parent: TransformNode;
    private _transform: TransformNode;
    private _options: any;
    private _scene: Scene;
    private _diagramEventObservable: Observable<DiagramEvent>;

    constructor(fromId: string, input: WebXRInputSource, point: Vector3, diagramEventObservable: Observable<DiagramEvent>) {
        this._scene = DefaultScene.Scene;
        this._diagramEventObservable = diagramEventObservable;
        const fromMesh = this._scene.getMeshById(fromId);

        if (fromMesh) {
            this._parent = input.pointer;
            this._fromId = fromMesh.id;
            this._transform = new TransformNode("transform", this._scene);

            this._transform.position = point.clone();
            this._transform.setParent(this._parent);
            this._fromPoint = fromMesh.getAbsolutePosition();

            const target = MeshBuilder.CreateSphere("target", {segments: 8, diameter: .02});
            target.parent = this._transform;
            const ray: Ray = new Ray(fromMesh.getAbsolutePosition(), target.absoluteScaling);
            const pick = this._scene.pickWithRay(ray, (mesh) => {
                return mesh.id === "target";
            });

            target.isPickable = false;

            if (pick.pickedPoint) {
                console.log('picked');
                this._options = {
                    points: [this._fromPoint, pick.pickedPoint],
                    updatable: true,
                    useAlphaForLines: false,
                };
            } else {
                this._options = {
                    points: [this._fromPoint, this._transform.absolutePosition],
                    updatable: true,
                    useAlphaForLines: false,
                };
            }
            this._line = MeshBuilder.CreateLines("connectionPreview", this._options, this._scene);
            this._options.instance = this._line;
            this._renderObserver = this._scene.onBeforeRenderObservable.add(() => {
                this._options.points[1] = this._transform.absolutePosition;
                this._line = MeshBuilder.CreateLines("connectionPreview", this._options);
            });
        }
    }

    public dispose() {
        this._scene.onBeforeRenderObservable.remove(this._renderObserver);
        this._parent = null;
        this._transform.dispose(false, true);
        this._line.dispose();
    }

    public connect(mesh: AbstractMesh) {
        if (mesh) {
            this._diagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: {
                    from: this._fromId,
                    to: mesh.id,
                    template: DiagramTemplates.CONNECTION,
                    color: '#000000'
                }
            }, DiagramEventObserverMask.ALL);
            this.dispose();
        }

    }

}
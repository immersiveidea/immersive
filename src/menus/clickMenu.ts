import {Button3D, GUI3DManager, PlanePanel, TextBlock} from "@babylonjs/gui";
import {AbstractMesh, Tools, TransformNode, Vector3} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "../diagram/types/diagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramConnection} from "../diagram/diagramConnection";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";

export class ClickMenu {
    private static readonly sounds;
    private readonly entity: AbstractMesh;
    private readonly manager: GUI3DManager;
    private readonly transform: TransformNode;
    private readonly diagramManager: DiagramManager;
    private utilityPosition: Vector3;

    private connection: DiagramConnection = null;

    constructor(entity: AbstractMesh, diagramManager: DiagramManager, grip: TransformNode) {
        this.entity = entity;
        this.diagramManager = diagramManager;
        const scene = entity.getScene();
        const manager = new GUI3DManager(scene);
        manager.onPickingObservable.add((mesh) => {
            if (mesh) {
                this.utilityPosition = mesh.getAbsolutePosition();
            }
        });
        const transform = new TransformNode("transform", scene);
        const panel = new PlanePanel();

        panel.orientation = PlanePanel.FACEFORWARD_ORIENTATION;
        panel.columns = 4;
        panel.margin = .1;
        manager.addControl(panel);
        panel.linkToTransformNode(transform);
        panel.addControl(this.makeButton("Remove", "remove", grip));
        panel.addControl(this.makeButton("Label", "label", grip));
        panel.addControl(this.makeButton("Connect", "connect", grip));
        panel.addControl(this.makeButton("Close", "close", grip));
        manager.controlScaling = .1;
        panel.updateLayout();
        this.transform = transform;
        this.manager = manager;
        Tools.SetImmediate(() => {
            transform.position = entity.absolutePosition.clone();
            transform.position.y = entity.getBoundingInfo().boundingBox.maximumWorld.y + .1;
            transform.billboardMode = TransformNode.BILLBOARDMODE_Y;
        });
    }

    public get isConnecting() {
        return this.connection != null;
    }

    public get isDisposed(): boolean {
        return this.transform.isDisposed();
    }

    public connect(mesh: AbstractMesh) {
        if (this.connection) {
            if (mesh && isDiagramEntity(mesh)) {
                this.connection.to = mesh.id;
                this.diagramManager.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: toDiagramEntity(this.connection.mesh)
                }, -1);
                this.connection = null;
                this.dispose();
            }
        }
    }

    private makeButton(name: string, id: string, grip: TransformNode) {
        const button = new Button3D(name);
        button.scaling = new Vector3(.1, .1, .1);
        button.name = id;
        const text = new TextBlock(name, name);
        text.fontSize = "48px";
        text.color = "#ffffee";
        text.alpha = 1;
        button.content = text;
        button.onPointerClickObservable.add(() => {
            switch (id) {
                case "close":
                    this.dispose();
                    break;
                case "remove":
                    const event: DiagramEvent = {
                        type: DiagramEventType.REMOVE,
                        entity:
                            toDiagramEntity(this.entity)
                    }
                    this.diagramManager.onDiagramEventObservable.notifyObservers(event, -1);
                    this.dispose();
                    break;
                case "label":
                    this.diagramManager.editText(this.entity);
                    this.dispose();
                    break;
                case "connect":
                    this.createMeshConnection(this.entity, grip);

            }
        }, -1, false, this, true);
        return button;
    }

    private createMeshConnection(mesh: AbstractMesh, grip: TransformNode) {
        this.connection = new DiagramConnection(mesh.id, null, null, this.transform.getScene(), grip, this.utilityPosition);
    }

    private dispose() {
        this.manager.onPickingObservable.clear();
        this.manager.dispose();
        this.transform.dispose();

    }
}
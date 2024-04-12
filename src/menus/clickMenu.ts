import {Button3D, GUI3DManager, PlanePanel, TextBlock} from "@babylonjs/gui";
import {AbstractMesh, TransformNode} from "@babylonjs/core";
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


    private connection: DiagramConnection = null;

    constructor(entity: AbstractMesh, diagramManager: DiagramManager, grip: TransformNode) {
        this.entity = entity;
        this.diagramManager = diagramManager;
        const scene = entity.getScene();
        const manager = new GUI3DManager(scene);
        const transform = new TransformNode("transform", scene);

        transform.position = entity.absolutePosition.clone();
        transform.position.y += entity.scaling.y;

        const panel = new PlanePanel();

        panel.orientation = PlanePanel.FACEFORWARDREVERSED_ORIENTATION;
        panel.columns = 4;

        manager.controlScaling = .1;
        manager.addControl(panel);

        panel.addControl(this.makeButton("Remove", "remove", grip));
        panel.addControl(this.makeButton("Label", "label", grip));
        panel.addControl(this.makeButton("Connect", "connect", grip));
        panel.addControl(this.makeButton("Close", "close", grip));

        panel.linkToTransformNode(transform);
        this.transform = transform;
        this.manager = manager;
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
        //button.scaling = new Vector3(.1, .1, .1);
        button.name = id;
        const text = new TextBlock(name, name);
        text.fontSize = "48px";
        text.color = "#ffffff";
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
        this.connection = new DiagramConnection(mesh.id, null, null, this.transform.getScene(), grip);
    }

    private dispose() {
        this.manager.dispose();
        this.transform.dispose();

    }
}
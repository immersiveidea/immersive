import {Button3D, GUI3DManager, PlanePanel, TextBlock} from "@babylonjs/gui";
import {AbstractMesh, TransformNode} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "../diagram/types/diagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {DiagramManager} from "../diagram/diagramManager";

export class ClickMenu {
    private static readonly sounds;
    private readonly entity: AbstractMesh;
    private readonly manager: GUI3DManager;
    private readonly transform: TransformNode;
    private readonly diagramManager: DiagramManager;

    constructor(entity: AbstractMesh, diagramManager: DiagramManager) {
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

        panel.addControl(this.makeButton("Remove", "remove"));
        panel.addControl(this.makeButton("Label", "label"));
        panel.addControl(this.makeButton("Connect", "connect"));
        panel.addControl(this.makeButton("Close", "close"));

        panel.linkToTransformNode(transform);
        this.transform = transform;
        this.manager = manager;
    }

    private makeButton(name: string, id: string) {
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


            }

        }, -1, false, this, true);
        return button;
    }

    private dispose() {
        this.manager.dispose();
        this.transform.dispose();
    }
}
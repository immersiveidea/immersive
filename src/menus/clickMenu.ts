import {AbstractMesh, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "../diagram/types/diagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramConnection} from "../diagram/diagramConnection";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";
import {HtmlButton} from "babylon-html";

export class ClickMenu {
    private readonly _mesh: AbstractMesh;
    private readonly transform: TransformNode;
    private readonly diagramManager: DiagramManager;
    private connection: DiagramConnection = null;

    constructor(mesh: AbstractMesh, diagramManager: DiagramManager, grip: TransformNode) {
        this._mesh = mesh;
        this.diagramManager = diagramManager;
        const scene = mesh.getScene();
        this.transform = new TransformNode("transform", scene);
        let x = -.54 / 2;

        const removeButton: HtmlButton = this.makeNewButton("Remove", "remove", scene, x += .11);
        removeButton.onPointerObservable.add((eventData) => {
            if (eventData.sourceEvent.type == "pointerup") {
                const event: DiagramEvent = {
                    type: DiagramEventType.REMOVE,
                    entity:
                        toDiagramEntity(this._mesh)
                }
                this.diagramManager.onDiagramEventObservable.notifyObservers(event, -1);
                this.dispose();
            }
        }, -1, false, this, false);

        const labelButton: HtmlButton = this.makeNewButton("Label", "label", scene, x += .11);
        labelButton.onPointerObservable.add((eventData) => {
            if (eventData.sourceEvent.type == "pointerup") {
                this.diagramManager.editText(this._mesh);
                this.dispose();
            }
        }, -1, false, this, false);

        const connectButton: HtmlButton = this.makeNewButton("Connect", "connect", scene, x += .11);
        connectButton.onPointerObservable.add((eventData) => {
            if (eventData.sourceEvent.type == "pointerup") {
                this.createMeshConnection(this._mesh, grip, eventData.additionalData.pickedPoint.clone());
            }
        }, -1, false, this, false);

        const closeButton: HtmlButton = this.makeNewButton("Close", "close", scene, x += .11);
        closeButton.onPointerObservable.add((eventData) => {
            eventData.sourceEvent.type == "pointerup" && this.dispose();
        }, -1, false, this, false);

        const sizeButton: HtmlButton = this.makeNewButton("Size", "size", scene, x += .11);
        sizeButton.onPointerObservable.add((eventData) => {
            if (eventData.sourceEvent.type == "pointerup") {
                this.diagramManager.scaleMenu.show(this._mesh);
            }
        }, -1, false, this, false);


        this.transform.position = mesh.absolutePosition.clone();
        this.transform.position.y = mesh.getBoundingInfo().boundingBox.maximumWorld.y + .1;
        this.transform.billboardMode = TransformNode.BILLBOARDMODE_Y;
    }

    private makeNewButton(name: string, id: string, scene: Scene, x: number): HtmlButton {
        const button = new HtmlButton(name, id, scene, null, {html: null, image: {width: 268, height: 268}});
        button.transform.parent = this.transform;
        button.transform.rotation.y = Math.PI;
        button.transform.position.x = x;
        return button;
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

    private createMeshConnection(mesh: AbstractMesh, grip: TransformNode, utilityPosition: Vector3) {
        this.connection = new DiagramConnection(mesh.id, null, null, this.transform.getScene(), grip, utilityPosition);
    }

    private dispose() {
        this.diagramManager.scaleMenu.hide();
        this.transform.dispose(false, true);
    }
}
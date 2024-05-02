import {AbstractMesh, ActionEvent, Observable, Scene, TransformNode, Vector3, WebXRInputSource} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "../diagram/types/diagramEntity";
import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {DiagramConnection} from "../diagram/diagramConnection";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";
import {HtmlButton} from "babylon-html";
import {DiagramEventObserverMask} from "../diagram/types/diagramEventObserverMask";

const POINTER_UP = "pointerup";
export class ClickMenu {
    private readonly _mesh: AbstractMesh;
    private readonly transform: TransformNode;
    private connection: DiagramConnection = null;

    public onClickMenuObservable: Observable<ActionEvent> = new Observable<ActionEvent>();
    private _diagramEventObservable: Observable<DiagramEvent>;

    constructor(mesh: AbstractMesh, input: WebXRInputSource, diagramEventObservable: Observable<DiagramEvent>) {
        const grip = input.grip;
        this._mesh = mesh;
        this._diagramEventObservable = diagramEventObservable;
        //this.diagramManager = diagramManager;
        const scene = mesh.getScene();
        this.transform = new TransformNode("transform", scene);
        let x = -.54 / 2;

        const removeButton: HtmlButton = this.makeNewButton("Remove", "remove", scene, x += .11);
        removeButton.onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);


        const labelButton: HtmlButton = this.makeNewButton("Label", "label", scene, x += .11);
        labelButton.onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        const connectButton: HtmlButton = this.makeNewButton("Connect", "connect", scene, x += .11);
        connectButton.onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.createMeshConnection(this._mesh, grip, eventData.additionalData.pickedPoint.clone());
            }
        }, -1, false, this, false);

        const closeButton: HtmlButton = this.makeNewButton("Close", "close", scene, x += .11);
        closeButton.onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        const sizeButton: HtmlButton = this.makeNewButton("Size", "size", scene, x += .11);
        sizeButton.onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
            }
        }, -1, false, this, false);


        const meshPos = mesh.absolutePosition.clone();
        const camPos = scene.activeCamera.globalPosition.clone();
        const direction = meshPos.subtract(camPos).normalize();

        //const {min, max} = mesh.getHierarchyBoundingVectors(true);

        this.transform.position = camPos.add(direction.scale(.8));
        this.transform.lookAt(meshPos);
        this.transform.position.y = this.transform.position.y - .2;

        //this.transform.billboardMode = TransformNode.BILLBOARDMODE_Y;
        const platform = scene.getMeshByName("platform");
        this.transform.setParent(platform);



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

    public get mesh(): AbstractMesh {
        return this._mesh;
    }
    public connect(mesh: AbstractMesh) {
        if (this.connection) {
            if (mesh && isDiagramEntity(mesh)) {
                this.connection.to = mesh.id;
                this._diagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: toDiagramEntity(this.connection.mesh)
                }, DiagramEventObserverMask.ALL);
                this.connection = null;
                this.dispose();
            }
        }
    }

    private createMeshConnection(mesh: AbstractMesh, grip: TransformNode, utilityPosition: Vector3) {
        this.connection = new DiagramConnection(mesh.id, null, null, this.transform.getScene(), grip, utilityPosition);
    }

    private dispose() {
        this.transform.dispose(false, true);
    }
}

function isUp(event: ActionEvent): boolean {
    return event?.sourceEvent?.type == POINTER_UP;
}
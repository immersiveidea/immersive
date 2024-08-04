import {AbstractMesh, ActionEvent, Observable, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {Button} from "../objects/Button";
import {positionNode} from "./functions/positionNode";
import {isUp} from "./functions/isUp";

export class ClickMenu {
    private readonly _mesh: AbstractMesh;
    private readonly _transformNode: TransformNode;
    public onClickMenuObservable: Observable<ActionEvent> = new Observable<ActionEvent>();

    constructor(mesh: AbstractMesh) {
        this._mesh = mesh;
        const scene = mesh.getScene();
        this._transformNode = new TransformNode("transform", scene);
        let x = -.54 / 2;

        this.makeNewButton("Remove", "remove", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);


        this.makeNewButton("Label", "label", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        this.makeNewButton("Connect", "connect", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        this.makeNewButton("Size", "size", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
            }
        }, -1, false, this, false);

        this.makeNewButton("Group", "group", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        this.makeNewButton("Close", "close", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);
        positionNode(this._transformNode);
    }

    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    public dispose() {
        this._transformNode.dispose(false, true);
    }

    private makeNewButton(name: string, id: string, scene: Scene, x: number): Button {
        const button = new Button(name, id, scene)
        button.transform.scaling = new Vector3(.2, .2, .2);
        button.transform.rotate(Vector3.Up(), Math.PI);
        const transform = button.transform;
        transform.parent = this._transformNode;
        //transform.rotation.y = Math.PI;
        transform.position.x = x;
        return button;
    }
}

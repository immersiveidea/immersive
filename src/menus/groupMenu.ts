import {AbstractMesh, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {Button} from "../objects/Button";
import {positionNode} from "./functions/positionNode";
import {isUp} from "./functions/isUp";

export class GroupMenu {
    private readonly _mesh: AbstractMesh;
    private readonly _scene: Scene;
    private _transformNode: TransformNode;

    constructor(mesh: AbstractMesh) {
        this._mesh = mesh;
        this._scene = mesh.getScene();
        this._transformNode = new TransformNode("graoupTransform", this._scene);
        positionNode(this._transformNode);
        const button = this.buildButton("Done", "groupdone", this._scene, 0);
        button.onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.dispose();
            }
        }, -1, false, this, false);
    }

    private buildButton(name: string, id: string, scene: Scene, x: number): Button {
        const button = new Button(name, id, scene)
        button.transform.scaling = new Vector3(.2, .2, .2);
        button.transform.rotate(Vector3.Up(), Math.PI);
        const transform = button.transform;
        transform.parent = this._transformNode;
        transform.position.x = x;
        return button;
    }

    private dispose() {
        this._transformNode.dispose(false, true);
    }
}
import {Scene, TransformNode, Vector3} from "@babylonjs/core";
import {getFrontPosition} from "./getFrontPosition";

export function setMenuPosition(node: TransformNode, scene: Scene, offset: Vector3 = Vector3.Zero()) {
    const front = getFrontPosition(.8, scene);
    //front.y = scene.activeCamera.globalPosition.y;
    node.position = front;
    node.position.addInPlace(offset);
    node.position.y -= .5;

    node.lookAt(scene.activeCamera.globalPosition);
    node.rotation.y = node.rotation.y + Math.PI;
}
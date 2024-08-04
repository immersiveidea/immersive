import {TransformNode, Vector3} from "@babylonjs/core";
import {DefaultScene} from "../../defaultScene";

export function positionNode(transformNode: TransformNode) {
    const scene = DefaultScene.Scene;
    const platform = scene.getMeshByName("platform");
    const ray = scene.activeCamera.getForwardRay(1);
    ray.direction.y = 0;
    transformNode.position = scene.activeCamera.globalPosition.clone().add(ray.direction.scale(1));
    transformNode.position.y -= .4;
    transformNode.lookAt(scene.activeCamera.globalPosition);
    transformNode.rotate(Vector3.Up(), Math.PI);
    transformNode.setParent(platform);
}
import {Scene, TransformNode, Vector3} from "@babylonjs/core";

export class CameraHelper {
    public static getFrontPosition(distance: number, scene: Scene): Vector3 {
        const offset = new Vector3(0, 0, distance);
        offset.applyRotationQuaternionInPlace(scene.activeCamera.absoluteRotation);
        return scene.activeCamera.globalPosition.add(offset);
    }

    public static setMenuPosition(node: TransformNode, scene: Scene) {
        node.position =
            CameraHelper.getFrontPosition(2, scene);
        node.lookAt(scene.activeCamera.globalPosition);
        node.rotation.y = node.rotation.y + Math.PI;
        node.position.y += .2;

    }
}
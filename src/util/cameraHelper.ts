import {Scene, Vector3} from "@babylonjs/core";

export class CameraHelper {
    public static getFrontPosition(distance: number, scene: Scene): Vector3 {
        const offset = new Vector3(0, 0, distance);
        offset.applyRotationQuaternionInPlace(scene.activeCamera.absoluteRotation);
        return scene.activeCamera.globalPosition.add(offset);
    }
}
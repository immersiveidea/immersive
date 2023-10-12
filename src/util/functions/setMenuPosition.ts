import {Scene, TransformNode, Vector3} from "@babylonjs/core";
import {getFrontPosition} from "./getFrontPosition";

export function setMenuPosition(node: TransformNode, scene: Scene, offset: Vector3 = Vector3.Zero()) {
    /*
    scene.onActiveCameraChanged.add(() => {

        if (scene.activeCamera) {
            switch (scene.activeCamera.getClassName()) {
                case "WebXRCamera":
                    node.parent = null;
                    const front = getFrontPosition(.8, scene);
                    //front.y = scene.activeCamera.globalPosition.y;
                    node.position = front;
                    node.position.addInPlace(offset);
                    node.position.y -= .5;

                    node.lookAt(scene.activeCamera.globalPosition);
                    node.rotation.y = node.rotation.y + Math.PI;
                    break;
                case "FreeCamera":
                case "DeviceOrientationCamera":
                case "ArcRotateCamera":
                case "UniversalCamera":
                    node.parent = scene.activeCamera;
                    const width = scene.getEngine().getRenderWidth();
                    const height = scene.getEngine().getRenderHeight();
                    node.position.z = 3;
                    node.position.y = -.8;
                    break;

            }

        }
    });

     */
    if (scene.activeCamera) {
        switch (scene.activeCamera.getClassName()) {
            case "WebXRCamera":
                node.parent = null;
                const front = getFrontPosition(.8, scene);
                //front.y = scene.activeCamera.globalPosition.y;
                node.position = front;
                node.position.addInPlace(offset);
                node.position.y -= .5;

                node.lookAt(scene.activeCamera.globalPosition);
                node.rotation.y = node.rotation.y + Math.PI;
                break;
            case "FreeCamera":
            case "DeviceOrientationCamera":
            case "ArcRotateCamera":
            case "UniversalCamera":
                node.parent = scene.activeCamera;
                const width = scene.getEngine().getRenderWidth();
                const height = scene.getEngine().getRenderHeight();
                node.position.z = 2;
                node.position.y = -.8;
                break;

        }

    }
}

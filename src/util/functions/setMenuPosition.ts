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
        setPosition(node, scene, offset);

    } else {
        scene.onActiveCameraChanged.add((scene: Scene) => {
            setPosition(node, scene, offset);
        });
        console.error("No active camera");
    }

}

function setPosition(node: TransformNode, scene: Scene, offset: Vector3 = Vector3.Zero()) {
    const platform = scene.getMeshByName("platform");
    switch (scene.activeCamera.getClassName()) {
        case "WebXRCamera":
            //const oldParent = node.parent;
            //console.log(oldParent.name);
            node.setParent(null);
            const front = getFrontPosition(1, scene);
            const camPos = scene.activeCamera.globalPosition.clone();
            node.position.x = front.x + offset.x;
            node.position.z = front.z + offset.z;
            node.position.y = 1.2 + offset.y;
            node.lookAt(camPos);
            node.setParent(platform);
            break;
        case "FreeCamera":
        case "DeviceOrientationCamera":
        case "ArcRotateCamera":
        case "UniversalCamera":
            node.parent = scene.activeCamera;
            const width = scene.getEngine().getRenderWidth();
            const height = scene.getEngine().getRenderHeight();
            node.position.z = 2;
            node.position.y = -.8 + offset.y;
            node.position.x = offset.x;
            break;
    }
    console.log('menu position set');

}
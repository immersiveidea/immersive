import {Scene, TransformNode, Vector3, WebXRCamera} from "@babylonjs/core";
import log from "loglevel";

const logger = log.getLogger('setMenuPosition');

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
        //setPosition(node, scene, offset);

    } else {
        scene.onActiveCameraChanged.add((scene: Scene) => {
            //setPosition(node, scene, offset);
        });
        logger.error("No active camera");
    }

}

const debug = false;
function setPosition(node: TransformNode, scene: Scene, offset: Vector3 = Vector3.Zero()) {
    const platform = scene.getNodeById("platform");
    switch (scene.activeCamera.getClassName()) {
        case "WebXRCamera":
            //const oldParent = node.parent;
            window.setTimeout(() => {
                node.setParent(null);
                const camera = scene.activeCamera as WebXRCamera;
                const front = camera.getFrontPosition(.7);
                const camPos = camera.globalPosition.clone();
                const newPos = new Vector3(front.x + offset.x, front.y + offset.y - .3, front.z + offset.z);
                node.position = newPos;
                node.lookAt(camPos);
                node.setParent(platform);
            }, 1000);
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
    logger.debug('menu position set');

}
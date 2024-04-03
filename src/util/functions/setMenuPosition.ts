import {Scene, TransformNode, Vector3} from "@babylonjs/core";
import {getFrontPosition} from "./getFrontPosition";
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
        setPosition(node, scene, offset);

    } else {
        scene.onActiveCameraChanged.add((scene: Scene) => {
            setPosition(node, scene, offset);
        });
        logger.error("No active camera");
    }

}

const debug = true;
function setPosition(node: TransformNode, scene: Scene, offset: Vector3 = Vector3.Zero()) {
    const platform = scene.getNodeById("platform");
    switch (scene.activeCamera.getClassName()) {
        case "WebXRCamera":
            //const oldParent = node.parent;

            node.setParent(null);
            const front = getFrontPosition(1, scene).clone();
            const camPos = scene.activeCamera.globalPosition.clone();
            const newPos = new Vector3(front.x + offset.x, 1.2 + offset.y, front.z + offset.z);
            node.position = newPos;
            node.lookAt(camPos);
            //           const target = MeshBuilder.CreateIcoSphere("target", {radius: .1}, scene);
            //           target.position = newPos;
            //           target.setParent(platform);
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
    logger.debug('menu position set');

}
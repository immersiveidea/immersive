import {TransformNode} from "@babylonjs/core";


const debug = true;

export function displayDebug(text: string[]) {
    if (debug) {
        drawDebugText(text);
    }
}

function drawDebugText(text: string[]) {
    const transform = new TransformNode("debugTransform");
    transform.parent = transform.getScene().activeCamera;
    transform.getScene().onActiveCameraChanged.add(() => {
        transform.parent = transform.getScene().activeCamera;
    });
    console.log(text);
    transform.position.z = 1;
    transform.position.y = .2;

}
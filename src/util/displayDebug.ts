import {TransformNode} from "@babylonjs/core";
import {HtmlMeshBuilder} from "babylon-html";

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

    transform.position.z = 1;
    transform.position.y = .2;

    const plane = HtmlMeshBuilder.CreatePlaneSync('debugMesh', {
        html:
            `<div style="width: 100%; height: 100%; font-size: 16px; border-radius: 8px; background-color: #111122; color: #eeeeee"><center>${text.join('<br/>')}</center></div>
        `, width: .3, height: .05 * text.length, image: {width: 256, height: 32 * text.length}
    }, transform.getScene());
    plane.parent = transform;
}
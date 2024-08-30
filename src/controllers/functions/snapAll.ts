import {TransformNode, Vector3} from "@babylonjs/core";
import {getAppConfig} from "../../util/appConfig";
import {snapRotateVal} from "../../util/functions/snapRotateVal";
import {snapGridVal} from "../../util/functions/snapGridVal";

export function snapAll(node: TransformNode, pickPoint: Vector3) {
    const config = getAppConfig();
    const transform = new TransformNode('temp', node.getScene());
    transform.position = pickPoint;
    node.setParent(transform);
    if (config.rotationSnapEnabled) {
        node.rotation = snapRotateVal(node.absoluteRotationQuaternion.toEulerAngles(), parseFloat(config.rotationSnap));
    }
    if (config.locationSnapEnabled) {
        transform.position = snapGridVal(transform.absolutePosition, parseFloat(config.locationSnap));
    }

    node.setParent(null);
    if (config.locationSnapEnabled) {
        node.position = snapGridVal(node.absolutePosition, parseFloat(config.locationSnap));
    }

    transform.dispose();
}

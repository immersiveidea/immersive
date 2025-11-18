import {TransformNode, Vector3} from "@babylonjs/core";
import {appConfigInstance} from "../../util/appConfig";
import {snapRotateVal} from "../../util/functions/snapRotateVal";
import {snapGridVal} from "../../util/functions/snapGridVal";

export function snapAll(node: TransformNode, pickPoint: Vector3) {
    const config = appConfigInstance.current;
    const transform = new TransformNode('temp', node.getScene());
    transform.position = pickPoint;
    node.setParent(transform);
    if (config.rotateSnap > 0) {
        node.rotation = snapRotateVal(node.absoluteRotationQuaternion.toEulerAngles(), config.rotateSnap);
    }
    if (config.locationSnap > 0) {
        transform.position = snapGridVal(transform.absolutePosition, config.locationSnap);
    }

    node.setParent(null);
    if (config.locationSnap > 0) {
        node.position = snapGridVal(node.absolutePosition, config.locationSnap);
    }

    transform.dispose();
}

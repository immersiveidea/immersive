import {TransformNode, Vector3} from "@babylonjs/core";
import {AppConfig} from "../../util/appConfig";
import {snapRotateVal} from "../../util/functions/snapRotateVal";
import {snapGridVal} from "../../util/functions/snapGridVal";

export function snapAll(node: TransformNode, config: AppConfig, pickPoint: Vector3) {
    const transform = new TransformNode('temp', node.getScene());
    transform.position = pickPoint;
    node.setParent(transform);
    node.rotation = snapRotateVal(node.absoluteRotationQuaternion.toEulerAngles(), config.current.rotateSnap);
    transform.position = snapGridVal(transform.absolutePosition, config.current.gridSnap);
    node.setParent(null);
    node.position = snapGridVal(node.absolutePosition, config.current.gridSnap);
    transform.dispose();
}

import {Angle, Vector3} from "@babylonjs/core";
import round from "round";
import log from "loglevel";

const logger = log.getLogger('snapRotateVal');

export function snapRotateVal(value: Vector3, snap: number): Vector3 {
    if (!snap) {
        return value;
    }
    const rotation = new Vector3(
        snapAngle(value.x, snap),
        snapAngle(value.y, snap),
        snapAngle(value.z, snap));
    return rotation;
}

function snapAngle(val: number, snap: number): number {
    const angle = snap;
    const deg = Angle.FromRadians(val).degrees();
    const snappedDegrees = round(deg, angle);
    logger.debug("deg", val, deg, snappedDegrees, angle);
    return Angle.FromDegrees(snappedDegrees).radians();
}
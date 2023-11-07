import {Vector3} from "@babylonjs/core";
import round from "round";

export function snapGridVal(value: Vector3, snap: number): Vector3 {
    if (!snap) {
        return value;
    }
    return new Vector3(round(value.x, snap),
        round(value.y, snap),
        round(value.z, snap))

}
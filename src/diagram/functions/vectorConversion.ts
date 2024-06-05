import {Vector3} from "@babylonjs/core";

export function vectoxys(v: Vector3): { x, y, z } {
    return {x: v.x, y: v.y, z: v.z};
}

export function xyztovec(xyz: { x, y, z }): Vector3 {
    return new Vector3(xyz.x, xyz.y, xyz.z);
}
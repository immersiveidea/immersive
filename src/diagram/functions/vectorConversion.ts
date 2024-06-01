import {Vector3} from "@babylonjs/core";

export function vectoxys(v: Vector3): { x, y, z } {
    return {x: v.x, y: v.y, z: v.z};
}
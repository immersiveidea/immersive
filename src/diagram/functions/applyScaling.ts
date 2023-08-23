import {AbstractMesh, Vector3} from "@babylonjs/core";

export function applyScaling(oldMesh: AbstractMesh,
                             newMesh: AbstractMesh,
                             copy: boolean,
                             snap: number) {
    if (copy) {
        newMesh.scaling = oldMesh.scaling.clone();
    } else {
        if (snap) {
            newMesh.scaling.set(snap, snap, snap);
        } else {
            newMesh.scaling = Vector3.One();
        }
    }
}
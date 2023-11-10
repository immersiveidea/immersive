import {AbstractMesh} from "@babylonjs/core";

export function isDiagramEntity(mesh: AbstractMesh): boolean {
    if (mesh?.metadata?.template != undefined) {
        return true;
    } else {
        return false;
    }
}
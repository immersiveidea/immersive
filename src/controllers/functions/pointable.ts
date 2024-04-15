import {AbstractMesh} from "@babylonjs/core";

export function pointable(mesh: AbstractMesh): boolean {
    return (mesh && mesh.metadata?.template &&
        !mesh.metadata?.tool &&
        !mesh.metadata?.handle &&
        !mesh.metadata?.grabbable &&
        !mesh.metadata?.grabClone);
}
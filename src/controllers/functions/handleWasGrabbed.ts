import {AbstractMesh} from "@babylonjs/core";
import {isDiagramEntity} from "../../diagram/functions/isDiagramEntity";

export function handleWasGrabbed(mesh: AbstractMesh): boolean {
    if (isDiagramEntity(mesh)) {
        return false;
    } else {
        return (mesh?.metadata?.handle == true);
    }
}
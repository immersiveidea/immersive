import {AbstractMesh} from "@babylonjs/core";
import {isDiagramEntity} from "../../diagram/functions/isDiagramEntity";
import log from "loglevel";

export function handleWasGrabbed(mesh: AbstractMesh): boolean {
    const logger = log.getLogger("handleWasGrabbed");
    if (isDiagramEntity(mesh)) {
        logger.debug("handleWasGrabbed: mesh is a diagram entity");
        return false;
    } else {

        const result = (mesh?.metadata?.handle == true);
        logger.debug("handleWasGrabbed: mesh ", result);
        return result;
    }
}
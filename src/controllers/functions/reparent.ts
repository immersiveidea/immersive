import {AbstractMesh} from "@babylonjs/core";
import log from "loglevel";


export function reparent(mesh: AbstractMesh, previousParentId: string, grabbedMeshParentId: string) {
    const logger = log.getLogger('reparent');
    if (previousParentId) {
        const parent = mesh.getScene().getMeshById(previousParentId);
        if (parent) {
            logger.warn('not yet implemented')
        } else {
            mesh.setParent(null);
        }
    } else {
        const parent = mesh.getScene().getTransformNodeById(grabbedMeshParentId);
        if (parent) {
            logger.warn('setting parent to null', grabbedMeshParentId, parent)
            mesh.setParent(null);
            parent.dispose();
        } else {
            mesh.setParent(null);
        }
    }
}
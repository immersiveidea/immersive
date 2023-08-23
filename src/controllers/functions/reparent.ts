import {AbstractMesh} from "@babylonjs/core";
import log from "loglevel";

const logger = log.getLogger('reparent');

export function reparent(mesh: AbstractMesh, previousParentId: string, grabbedMeshParentId: string) {
    if (previousParentId) {
        const parent = mesh.getScene().getMeshById(previousParentId);
        if (parent) {
            //mesh && mesh.setParent(this.scene.getMeshById(this.previousParentId));
            logger.warn('not yet implemented')
            //@note: this is not implemented yet
        } else {
            mesh.setParent(null);
        }
    } else {
        const parent = mesh.getScene().getTransformNodeById(grabbedMeshParentId);
        if (parent) {
            logger.warn('setting parent to null', grabbedMeshParentId, parent)
            //this.grabbedMeshParentId = null;
            parent.dispose();
        } else {
            mesh.setParent(null);
        }
    }
}
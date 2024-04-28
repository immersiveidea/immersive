import {HavokPlugin} from "@babylonjs/core";
import {DefaultScene} from "../../defaultScene";
import log from "loglevel";


export function beforeRenderObserver() {
    const logger = log.getLogger('beforeRenderObserver');
    if (this?.grabbedMesh?.physicsBody) {
        const scene = DefaultScene.Scene;
        const hk = (scene.getPhysicsEngine().getPhysicsPlugin() as HavokPlugin);
        this.lastPosition = this?.grabbedMesh?.physicsBody?.transformNode.absolutePosition.clone();
        if (this.grabbedMeshParentId) {
            const parent = scene.getTransformNodeById(this.grabbedMeshParentId);
            if (parent) {
                hk.setPhysicsBodyTransformation(this.grabbedMesh.physicsBody, parent);
                hk.sync(this.grabbedMesh.physicsBody);
            } else {
                logger.error("parent not found for " + this.grabbedMeshParentId);
            }

        } else {
            logger.warn("no parent id");
        }

    }
}
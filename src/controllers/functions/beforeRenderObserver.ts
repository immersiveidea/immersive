import {HavokPlugin} from "@babylonjs/core";

export function beforeRenderObserver() {
    if (this?.grabbedMesh?.physicsBody) {
        const hk = (this.scene.getPhysicsEngine().getPhysicsPlugin() as HavokPlugin);
        this.lastPosition = this?.grabbedMesh?.physicsBody?.transformNode.absolutePosition.clone();
        if (this.grabbedMeshParentId) {
            const parent = this.scene.getTransformNodeById(this.grabbedMeshParentId);
            if (parent) {
                hk.setPhysicsBodyTransformation(this.grabbedMesh.physicsBody, parent);
                hk.sync(this.grabbedMesh.physicsBody);
            } else {
                this.logger.error("parent not found for " + this.grabbedMeshParentId);
            }

        } else {
            this.logger.warn("no parent id");
        }

    }
}
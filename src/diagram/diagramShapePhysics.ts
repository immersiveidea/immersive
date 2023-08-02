import {AbstractMesh, PhysicsAggregate, PhysicsBody, PhysicsMotionType, PhysicsShapeType, Scene} from "@babylonjs/core";
import {DiaSounds} from "../util/diaSounds";
import log from "loglevel";

export class DiagramShapePhysics {
    private static logger: log.Logger = log.getLogger('DiagramShapePhysics');

    public static applyPhysics(mesh: AbstractMesh, scene: Scene): PhysicsBody {
        if (!mesh?.metadata?.template) {
            this.logger.error("applyPhysics: mesh.metadata.template is null", mesh);
            return null;
        }
        if (!scene) {
            this.logger.error("applyPhysics: mesh or scene is null");
            return null;
        }
        if (mesh.physicsBody) {
            mesh.physicsBody.dispose();
        }

        let shapeType = PhysicsShapeType.BOX;
        switch (mesh.metadata.template) {
            case "#sphere-template":
                shapeType = PhysicsShapeType.SPHERE;
                break;
            case "#cylinder-template":
                shapeType = PhysicsShapeType.CYLINDER;
                break;
            case "#cone-template":
                shapeType = PhysicsShapeType.CONVEX_HULL;
                break;

        }
        let mass = mesh.scaling.x * mesh.scaling.y * mesh.scaling.z * 10;
        const aggregate = new PhysicsAggregate(mesh,
            shapeType, {mass: mass, restitution: .02, friction: .9}, scene);
        aggregate.body.setCollisionCallbackEnabled(true);
        aggregate.body.getCollisionObservable().add((event, state) => {
            if (event.distance > .001 && !DiaSounds.instance.low.isPlaying) {
                this.logger.debug(event, state);
                DiaSounds.instance.low.play();
            }

        }, -1, false, this);
        const body = aggregate.body;
        body.setMotionType(PhysicsMotionType.ANIMATED);
        body.setLinearDamping(.95);
        body.setAngularDamping(.99);
        body.setGravityFactor(0);
        return aggregate.body;
    }
}
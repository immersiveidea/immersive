import {DiaSounds} from "../../util/diaSounds";
import {AbstractMesh, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, Scene} from "@babylonjs/core";
import log from "loglevel";

export function applyPhysics(sounds: DiaSounds, mesh: AbstractMesh, scene: Scene, motionType?: PhysicsMotionType) {
    const logger = log.getLogger('DiagramShapePhysics');
    if (!mesh?.metadata?.template) {
        logger.error("applyPhysics: mesh.metadata.template is null", mesh);
        return;
    }
    if (mesh.metadata.template == '#connection-template') {
        return;
    }
    if (!scene) {
        logger.error("applyPhysics: mesh or scene is null");
        return;
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
    const body = aggregate.body;
    body.setLinearDamping(1.95);
    body.setAngularDamping(1.99);

    if (motionType) {
        body
            .setMotionType(motionType);
    } else {
        if (mesh.parent) {
            body
                .setMotionType(PhysicsMotionType.ANIMATED);
        } else {
            body
                .setMotionType(PhysicsMotionType.DYNAMIC);
        }
    }
    body.setCollisionCallbackEnabled(true);
    body.getCollisionObservable().add((event) => {

        if (event.impulse < 10 && event.impulse > 1) {
            const sound = sounds.bounce;
            sound.setVolume(event.impulse / 10);
            sound.attachToMesh(mesh);
            sound.play();
        }
    }, -1, false, this);
    //body.setMotionType(PhysicsMotionType.ANIMATED);
    body.setLinearDamping(.95);
    body.setAngularDamping(.99);
    body.setGravityFactor(0);
}
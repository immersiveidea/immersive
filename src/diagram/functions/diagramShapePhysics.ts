import {DiaSounds} from "../../util/diaSounds";
import {AbstractMesh, PhysicsAggregate, PhysicsBody, PhysicsMotionType, PhysicsShapeType, Scene} from "@babylonjs/core";
import log from "loglevel";

const logger = log.getLogger('DiagramShapePhysics');
const MASS_FACTOR = 10;

export function applyPhysics(sounds: DiaSounds,
                             mesh: AbstractMesh,
                             scene: Scene,
                             motionType?: PhysicsMotionType) {
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
    const mass = mesh.scaling.x * mesh.scaling.y * mesh.scaling.z * MASS_FACTOR;
    const aggregate = new PhysicsAggregate(mesh,
        shapeType, {mass: mass, restitution: .02, friction: .9}, scene);
    const body = aggregate.body;
    applyMotionType(motionType, body, mesh);

    body.setCollisionCallbackEnabled(true);
    body.getCollisionObservable().add((event) => {
        if (event.impulse < 10 && event.impulse > 1) {
            const sound = sounds.bounce;
            sound.setVolume(event.impulse / 10);
            sound.attachToMesh(mesh);
            sound.play();
        }
    }, -1, false);
    applyPhysicsDefaults(body);
}

function applyPhysicsDefaults(body: PhysicsBody) {
    body.setLinearDamping(.95);
    body.setAngularDamping(.99);
    body.setGravityFactor(0);
}

function applyMotionType(motionType: PhysicsMotionType, body: PhysicsBody, mesh: AbstractMesh) {
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
}

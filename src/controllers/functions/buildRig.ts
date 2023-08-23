import {
    Color3,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";

export function buildRig(scene: Scene): Mesh {
    const rigMesh = MeshBuilder.CreateBox("platform", {width: 2, height: .02, depth: 2}, scene);
    for (const cam of scene.cameras) {
        cam.parent = rigMesh;
    }
    const rigMaterial = new StandardMaterial("rigMaterial", scene);
    rigMaterial.diffuseColor = Color3.Blue();
    rigMesh.material = rigMaterial;
    rigMesh.setAbsolutePosition(new Vector3(0, .1, -3));
    rigMesh.visibility = 0;
    const rigAggregate =
        new PhysicsAggregate(
            rigMesh,
            PhysicsShapeType.CYLINDER,
            {friction: 0, center: Vector3.Zero(), radius: .5, mass: 10, restitution: .01},
            scene);

    rigAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    rigAggregate.body.setGravityFactor(.02);
    return rigMesh;
}

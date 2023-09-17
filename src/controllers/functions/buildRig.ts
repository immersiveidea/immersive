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
import {AppConfig} from "../../util/appConfig";

export function buildRig(scene: Scene, appConfig: AppConfig): Mesh {
    const rigMesh = MeshBuilder.CreateBox("platform", {width: 2, height: .1, depth: 2}, scene);
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
            {friction: 0, center: Vector3.Zero(), mass: 50, restitution: .1},
            scene);

    /*const rightFoot = MeshBuilder.CreateBox("rightFoot", {width: .1, height: .1, depth: .2}, scene);
    const rightFootAggregate =
        new PhysicsAggregate(
            rightFoot,
            PhysicsShapeType.BOX,
            { friction: 0, center: Vector3.Zero(),  radius: .2, pointA: new Vector3(0, 0, 0),
                pointB: new Vector3(0, 1.5, 0), mass: 50, restitution: .1},
            scene);
    rightFootAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    rightFoot.parent= rigAggregate.transformNode;
    rightFoot.material = rigMaterial;
    rightFoot.position.y=.05;
    rightFoot.position.x=.2;
    rightFoot.position.z= 2;

     */


    rigAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    if (appConfig.current.flyMode) {
        rigAggregate.body.setGravityFactor(.02);
    } else {
        rigAggregate.body.setGravityFactor(1);
    }

    return rigMesh;
}

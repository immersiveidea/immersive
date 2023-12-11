import {
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {AppConfig} from "../../util/appConfig";
import {buildStandardMaterial} from "../../materials/functions/buildStandardMaterial";

export function buildRig(scene: Scene, appConfig: AppConfig): Mesh {
    const rigMesh = MeshBuilder.CreateCylinder("platform", {diameter: .5, height: 1.6}, scene);

    const cameratransform = new TransformNode("cameraTransform", scene);
    cameratransform.parent = rigMesh;
    cameratransform.position = new Vector3(0, -.8, 0);
    for (const cam of scene.cameras) {
        cam.parent = cameratransform;
        console.log(cam.absoluteRotation);
    }


    scene.onActiveCameraChanged.add((s) => {
        cameratransform.rotation.set(0, Math.PI, 0);
        s.activeCamera.parent = cameratransform;
    });
    rigMesh.material = buildStandardMaterial("rigMaterial", scene, "#2222ff");
    rigMesh.setAbsolutePosition(new Vector3(0, .01, 3));
    rigMesh.lookAt(new Vector3(0, 0.01, 0));
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

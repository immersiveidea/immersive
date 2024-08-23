import {
    AxesViewer,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    TransformNode,
    Vector3,
    WebXRDefaultExperience
} from "@babylonjs/core";

import {DefaultScene} from "../../defaultScene";

export function buildRig(xr: WebXRDefaultExperience): Mesh {
    const scene = DefaultScene.Scene;
    const rigMesh = MeshBuilder.CreateCylinder("platform", {diameter: .5, height: .01}, scene);
    const cameratransform = new TransformNode("cameraTransform", scene);
    cameratransform.parent = rigMesh;
    xr.baseExperience.onInitialXRPoseSetObservable.add(() => {
        xr.baseExperience.camera.parent = cameratransform;
        xr.baseExperience.camera.position = new Vector3(0, 0, 0);
        cameratransform.rotation.set(0, Math.PI, 0);
    });
    for (const cam of scene.cameras) {
        cam.parent = cameratransform;
    }
    scene.onActiveCameraChanged.add(() => {
        for (const cam of scene.cameras) {
            cam.parent = cameratransform;
        }
    });

    rigMesh.setAbsolutePosition(new Vector3(0, .01, 5));
    rigMesh.isPickable = false;
    const axis = new AxesViewer(scene, .25);
    axis.zAxis.rotation.y = Math.PI;
    rigMesh.lookAt(new Vector3(0, 0.01, 0));
    rigMesh.visibility = 1;
    const rigAggregate =
        new PhysicsAggregate(
            rigMesh,
            PhysicsShapeType.CYLINDER,
            {friction: 0, center: Vector3.Zero(), mass: 50, restitution: .01},
            scene);
    rigAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    return rigMesh;
}

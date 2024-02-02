import {
    AxesViewer,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    TransformNode,
    Vector3,
    WebXRDefaultExperience
} from "@babylonjs/core";

import {buildStandardMaterial} from "../../materials/functions/buildStandardMaterial";

export function buildRig(scene: Scene, xr: WebXRDefaultExperience): Mesh {
    const rigMesh = MeshBuilder.CreateCylinder("platform", {diameter: .5, height: .2}, scene);
    const cameratransform = new TransformNode("cameraTransform", scene);
    cameratransform.parent = rigMesh;
    xr.baseExperience.onInitialXRPoseSetObservable.add((state) => {

        xr.baseExperience.camera.parent = cameratransform;
        xr.baseExperience.camera.position = new Vector3(0, 0, 0);


    });
    for (const cam of scene.cameras) {
        cam.parent = cameratransform;
        if (cam.getClassName() == "FreeCamera") {
            //cameratransform.position = new Vector3(0, 1.6, 0);
            //cam.position.set(0, 1.6, 0);
        } else {
            //cameratransform.position = new Vector3(0, 1.6, 0);
            //cam.position.set(0, 0, 0);
        }
    }

    scene.onActiveCameraChanged.add(() => {
        for (const cam of scene.cameras) {
            cam.parent = cameratransform;
            if (cam.getClassName() == "FreeCamera") {
                //cameratransform.position = new Vector3(0, 1.6, 0);
                //cam.position.set(0, 1.6, 0);
            } else {
                //cameratransform.position = new Vector3(0, 0, 0);
                //cam.position.set(0, 0, 0);
            }
        }
        cameratransform.rotation.set(0, Math.PI, 0);
        //s.activeCamera.parent = cameratransform;
    });
    rigMesh.material = buildStandardMaterial("rigMaterial", scene, "#2222ff");
    rigMesh.setAbsolutePosition(new Vector3(0, .01, 3));
    rigMesh.isPickable = false;
    new AxesViewer(scene, .25);
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

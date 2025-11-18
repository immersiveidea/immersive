import {HavokPlugin, Quaternion, Scene, Vector3} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import {snapGridVal} from "./functions/snapGridVal";
import {snapRotateVal} from "./functions/snapRotateVal";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";
import {appConfigInstance} from "./appConfig";

export class CustomPhysics {
    private readonly scene: Scene;


    constructor(scene: Scene) {
        this.scene = scene;
    }

    public async initializeAsync() {
        const havok = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havok);
        const scene = this.scene;
        const physicsEnable = scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);

        scene.collisionsEnabled = true;
        scene.onAfterPhysicsObservable.add(() => {
                const config = appConfigInstance.current;
                scene.meshes.forEach((mesh) => {
                    if (isDiagramEntity(mesh) && mesh.physicsBody) {
                        const body = mesh.physicsBody;
                        const linearVelocity = new Vector3();
                        body.getLinearVelocityToRef(linearVelocity);
                        if (linearVelocity.length() < .1) {

                            body.disablePreStep = false;

                            // Apply location snap if enabled
                            if (config.locationSnap > 0) {
                                const pos: Vector3 = body.getObjectCenterWorld();
                                const val: Vector3 = snapGridVal(pos, config.locationSnap);
                                body.transformNode.position.set(val.x, val.y, val.z);
                            }

                            // Apply rotation snap if enabled
                            if (config.rotateSnap > 0) {
                                const rot: Quaternion =
                                    Quaternion.FromEulerVector(
                                        snapRotateVal(body.transformNode.rotationQuaternion.toEulerAngles(),
                                            config.rotateSnap));

                                body.transformNode.rotationQuaternion.set(
                                    rot.x, rot.y, rot.z, rot.w
                                );
                            }

                            scene.onAfterRenderObservable.addOnce(() => {
                                body.disablePreStep = true;
                            });
                        }
                    }

                });
            }
        );
    }
}
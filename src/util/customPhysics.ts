import {HavokPlugin, Quaternion, Scene, Vector3} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import {AppConfig} from "./appConfig";
import {snapGridVal} from "./functions/snapGridVal";
import {snapRotateVal} from "./functions/snapRotateVal";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";

export class CustomPhysics {
    private readonly scene: Scene;
    private config: AppConfig;

    constructor(scene: Scene, config: AppConfig) {
        this.scene = scene;
        this.config = config;
    }

    public async initializeAsync() {
        const havok = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havok);
        const scene = this.scene;
        scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        scene.collisionsEnabled = true;
        scene.onAfterPhysicsObservable.add(() => {
                scene.meshes.forEach((mesh) => {
                    if (isDiagramEntity(mesh) && mesh.physicsBody) {
                        const body = mesh.physicsBody;
                        const linearVelocity = new Vector3();
                        body.getLinearVelocityToRef(linearVelocity);
                        if (linearVelocity.length() < .1) {

                            body.disablePreStep = false;
                            const pos: Vector3 = body.getObjectCenterWorld();
                            const val: Vector3 = snapGridVal(pos,
                                this.config.current.gridSnap);
                            body.transformNode.position.set(val.x, val.y, val.z);
                            const rot: Quaternion =
                                Quaternion.FromEulerVector(
                                    snapRotateVal(body.transformNode.rotationQuaternion.toEulerAngles(),
                                        this.config.current.rotateSnap))

                            body.transformNode.rotationQuaternion.set(
                                rot.x, rot.y, rot.z, rot.w
                            );
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
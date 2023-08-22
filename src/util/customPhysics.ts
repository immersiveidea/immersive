import {HavokPlugin, Quaternion, Scene, Vector3} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import {AppConfig} from "./appConfig";

export class CustomPhysics {
    private scene: Scene;
    private config: AppConfig;

    constructor(scene: Scene, config: AppConfig) {
        this.scene = scene;
        this.config = config;
    }

    public async initializeAsync() {
        const havok = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havok);
        this.scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        this.scene.collisionsEnabled = true;
        this.scene.onAfterPhysicsObservable.add(() => {
            this.scene.meshes.forEach((mesh) => {
                if (mesh?.metadata?.template && mesh.physicsBody) {
                    const body = mesh.physicsBody;
                    const linearVelocity = new Vector3();
                    body.getLinearVelocityToRef(linearVelocity);
                    if (linearVelocity.length() < .1) {
                        if (true) {
                            body.disablePreStep = false;
                            const pos: Vector3 = body.getObjectCenterWorld();
                            const val: Vector3 = this.config.snapGridVal(pos);
                            body.transformNode.position.set(val.x, val.y, val.z);
                            const rot: Quaternion =
                                Quaternion.FromEulerVector(this.config.snapRotateVal(body.transformNode.rotationQuaternion.toEulerAngles()))

                            body.transformNode.rotationQuaternion.set(
                                rot.x, rot.y, rot.z, rot.w
                            );

                            //mesh.metadata.snapped=true;
                            //(this.scene.getPhysicsEngine().getPhysicsPlugin() as IPhysicsEnginePluginV2).syncTransform(body, body.transformNode);
                            this.scene.onAfterRenderObservable.addOnce(() => {
                                body.disablePreStep = true;
                            });

                        } else {

                        }
                    } else {
                        //mesh.metadata.snapped = false;
                    }
                    //mesh.position = mesh.physicsImpostor.physicsBody.position;
                    //mesh.rotationQuaternion = mesh.physicsImpostor.physicsBody.quaternion;
                }
            });
        });
    }
}
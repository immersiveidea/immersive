import {HavokPlugin, Quaternion, Scene, Vector3} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import {AppConfig} from "./appConfig";

export class CustomPhysics {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
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
                        body.disablePreStep = false;
                        const bodyId = body._pluginData.hpBodyId[0];
                        // const position = body._pluginData._hknp.HP_Body_GetPosition(bodyId);
                        const pos: Vector3 = body.getObjectCenterWorld();
                        const val: Vector3 = AppConfig.config.snapGridVal(pos);
                        //body.setTargetTransform(val, body.transformNode.rotationQuaternion);
                        body.transformNode.position.set(val.x, val.y, val.z);
                        const rot: Quaternion =
                            Quaternion.FromEulerVector(AppConfig.config.snapRotateVal(body.transformNode.rotationQuaternion.toEulerAngles()))

                        body.transformNode.rotationQuaternion.set(
                            rot.x, rot.y, rot.z, rot.w
                        );

                        body.disablePreStep = true;
                    }
                    //mesh.position = mesh.physicsImpostor.physicsBody.position;
                    //mesh.rotationQuaternion = mesh.physicsImpostor.physicsBody.quaternion;
                }
            });
        });
    }
}
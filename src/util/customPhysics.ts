import {HavokPlugin, Scene, Vector3} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

export class CustomPhysics {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public async initializeAsync() {
        const havok = await HavokPhysics()
        const havokPlugin = new HavokPlugin(true, havok);
        this.scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        this.scene.collisionsEnabled = true;
    }
}
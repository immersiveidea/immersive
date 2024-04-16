import {Scene} from "@babylonjs/core";

export class DefaultScene {
    private static _scene: Scene;

    public static get scene(): Scene {
        return DefaultScene._scene;
    }

    static create(scene: Scene) {
        DefaultScene._scene = scene;
    }
}
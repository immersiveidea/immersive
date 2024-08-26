import {Texture} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

export class AnimatedLineTexture {
    private static _textureColors = new Uint8Array([10, 10, 10, 10, 10, 10, 25, 25, 25, 10, 10, 255])
    private static _texture: Texture;

    public static Texture() {
        if (!AnimatedLineTexture._texture) {
            this._texture = new Texture('/assets/textures/arrow.png', DefaultScene.Scene);
            this._texture.name = 'connection-texture';
            this._texture.uScale = 30;
            DefaultScene.Scene.onBeforeRenderObservable.add(() => {
                this._texture.uOffset -= 0.01 * DefaultScene.Scene.getAnimationRatio()
            });
        }
        return this._texture;
    }
}
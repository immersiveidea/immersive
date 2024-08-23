import {Engine, RawTexture} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

export class AnimatedLineTexture {
    private static _textureColors = new Uint8Array([10, 10, 10, 10, 10, 10, 25, 25, 25, 10, 10, 255])
    private static _texture: RawTexture;

    public static Texture() {
        if (!AnimatedLineTexture._texture) {
            this._texture = new RawTexture(
                this._textureColors,
                this._textureColors.length / 3,
                1,
                Engine.TEXTUREFORMAT_RGB,
                DefaultScene.Scene,
                false,
                true,
                Engine.TEXTURE_NEAREST_NEAREST
            )
            this._texture.wrapU = RawTexture.WRAP_ADDRESSMODE
            this._texture.name = 'blue-white-texture';
            this._texture.uScale = 30;
            DefaultScene.Scene.onBeforeRenderObservable.add(() => {
                this._texture.uOffset -= 0.05 * DefaultScene.Scene.getAnimationRatio()
            });

        }
        return this._texture;
    }
}
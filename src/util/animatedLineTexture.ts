import {Texture} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

/**
 * Creates an SVG arrow as a data URL
 * @param hexColor - Hex color string (e.g., '#00ff00')
 * @returns Base64-encoded SVG data URL
 */
function createArrowSvg(hexColor: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <polygon points="8,6 26,16 8,26" fill="${hexColor}" />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export class AnimatedLineTexture {
    private static _texture: Texture;
    private static _animatedTextures: Set<Texture> = new Set();
    private static _animationObserverAdded: boolean = false;

    public static Texture() {
        if (!AnimatedLineTexture._texture) {
            this._texture = new Texture(createArrowSvg('#00ff00'), DefaultScene.Scene);
            this._texture.name = 'connection-texture';
            this._texture.uScale = 30;
            this._animatedTextures.add(this._texture);

            if (!this._animationObserverAdded) {
                DefaultScene.Scene.onBeforeRenderObservable.add(() => {
                    this._animatedTextures.forEach(texture => {
                        texture.uOffset -= 0.01 * DefaultScene.Scene.getAnimationRatio();
                    });
                });
                this._animationObserverAdded = true;
            }
        }
        return this._texture;
    }

    /**
     * Creates a new texture with a specific color
     * @param hexColor - Hex color string (e.g., '#ff0000')
     * @returns A new texture instance with the specified color
     */
    public static CreateColoredTexture(hexColor: string): Texture {
        const texture = new Texture(createArrowSvg(hexColor), DefaultScene.Scene);
        texture.name = `connection-texture-${hexColor}`;
        texture.uScale = 30;

        // Track this texture for animation updates
        this._animatedTextures.add(texture);

        // Ensure animation observer is set up
        if (!this._animationObserverAdded) {
            DefaultScene.Scene.onBeforeRenderObservable.add(() => {
                this._animatedTextures.forEach(t => {
                    t.uOffset -= 0.01 * DefaultScene.Scene.getAnimationRatio();
                });
            });
            this._animationObserverAdded = true;
        }

        return texture;
    }

    /**
     * Removes a texture from the animation set when disposed
     * @param texture - The texture to stop animating
     */
    public static DisposeTexture(texture: Texture): void {
        this._animatedTextures.delete(texture);
        texture.dispose();
    }
}
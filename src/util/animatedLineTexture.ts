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
    private static _coloredTextureCache: Map<string, Texture> = new Map();
    private static _frameCounter: number = 0;

    public static Texture() {
        if (!AnimatedLineTexture._texture) {
            this._texture = new Texture(createArrowSvg('#ffffff'), DefaultScene.Scene);
            this._texture.name = 'connection-texture';
            this._texture.uScale = 30;
            this._animatedTextures.add(this._texture);

            if (!this._animationObserverAdded) {
                DefaultScene.Scene.onBeforeRenderObservable.add(() => {
                    // Update every other frame for performance (still smooth at 45fps in 90fps VR)
                    this._frameCounter++;
                    if (this._frameCounter % 2 === 0) {
                        this._animatedTextures.forEach(texture => {
                            // Double the offset to maintain same visual speed with half update frequency
                            texture.uOffset -= 0.02 * DefaultScene.Scene.getAnimationRatio();
                        });
                    }
                });
                this._animationObserverAdded = true;
            }
        }
        return this._texture;
    }

    /**
     * Creates a new texture with a specific color (cached for reuse)
     * @param hexColor - Hex color string (e.g., '#ff0000')
     * @returns A cached texture instance with the specified color
     */
    public static CreateColoredTexture(hexColor: string): Texture {
        // Check cache first - reuse textures for same color
        if (this._coloredTextureCache.has(hexColor)) {
            return this._coloredTextureCache.get(hexColor)!;
        }

        // Create new texture if not cached
        const texture = new Texture(createArrowSvg(hexColor), DefaultScene.Scene);
        texture.name = `connection-texture-${hexColor}`;
        texture.uScale = 30;

        // Cache for future reuse
        this._coloredTextureCache.set(hexColor, texture);

        // Track this texture for animation updates
        this._animatedTextures.add(texture);

        // Ensure animation observer is set up
        if (!this._animationObserverAdded) {
            DefaultScene.Scene.onBeforeRenderObservable.add(() => {
                // Update every other frame for performance (still smooth at 45fps in 90fps VR)
                this._frameCounter++;
                if (this._frameCounter % 2 === 0) {
                    this._animatedTextures.forEach(t => {
                        // Double the offset to maintain same visual speed with half update frequency
                        t.uOffset -= 0.02 * DefaultScene.Scene.getAnimationRatio();
                    });
                }
            });
            this._animationObserverAdded = true;
        }

        return texture;
    }

    /**
     * Removes a texture from the animation set when disposed
     * WARNING: Do NOT call this on cached textures! Only for non-cached textures.
     * Cached textures are shared across multiple connections.
     * Use ClearCache() to dispose cached textures properly.
     * @param texture - The texture to stop animating
     */
    public static DisposeTexture(texture: Texture): void {
        // Safety check: prevent disposing cached textures (they're shared!)
        for (const [color, cachedTexture] of this._coloredTextureCache.entries()) {
            if (cachedTexture === texture) {
                console.error(
                    `AnimatedLineTexture.DisposeTexture: Attempted to dispose cached texture ` +
                    `"${texture.name}" (color: ${color}). This will break texture sharing! ` +
                    `Cached textures should not be disposed individually. Use ClearCache() instead.`
                );
                return;  // Don't dispose - it's shared across multiple connections
            }
        }

        // Only dispose non-cached textures
        this._animatedTextures.delete(texture);
        texture.dispose();
    }

    /**
     * Preload textures for common colors to prevent first-render stutter
     * @param colors - Array of hex color strings to preload
     */
    public static PreloadTextures(colors: string[]): void {
        colors.forEach(color => {
            this.CreateColoredTexture(color);
        });
    }

    /**
     * Clear the texture cache and dispose all cached textures
     * Use with caution - only call when no connections are using these textures
     */
    public static ClearCache(): void {
        this._coloredTextureCache.forEach((texture) => {
            this._animatedTextures.delete(texture);
            texture.dispose();
        });
        this._coloredTextureCache.clear();
    }

    /**
     * Get cache statistics for debugging
     * @returns Object with cache stats
     */
    public static GetCacheStats(): { cachedColors: number; totalAnimatedTextures: number; colors: string[] } {
        return {
            cachedColors: this._coloredTextureCache.size,
            totalAnimatedTextures: this._animatedTextures.size,
            colors: Array.from(this._coloredTextureCache.keys())
        };
    }
}
import {Color3, DynamicTexture, Scene} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

export class LightmapGenerator {
    private static lightmapCache: Map<string, DynamicTexture> = new Map();
    private static readonly DEFAULT_RESOLUTION = 512;

    /**
     * Generates or retrieves cached lightmap for a given color
     * @param color The base color for the lightmap
     * @param scene The BabylonJS scene
     * @param resolution Texture resolution (default: 512)
     * @returns DynamicTexture with baked lighting
     */
    public static generateLightmapForColor(
        color: Color3,
        scene: Scene,
        resolution: number = LightmapGenerator.DEFAULT_RESOLUTION
    ): DynamicTexture {
        const colorKey = color.toHexString();

        // Return cached lightmap if available
        if (this.lightmapCache.has(colorKey)) {
            return this.lightmapCache.get(colorKey)!;
        }

        // Create new lightmap
        const lightmap = this.createLightmap(color, scene, resolution);
        this.lightmapCache.set(colorKey, lightmap);
        return lightmap;
    }

    /**
     * Pre-generates lightmaps for all specified colors
     * Call during initialization for better first-render performance
     * @param colors Array of hex color strings
     * @param scene The BabylonJS scene
     */
    public static preloadLightmaps(colors: string[], scene: Scene): void {
        colors.forEach(colorHex => {
            const color = Color3.FromHexString(colorHex);
            this.generateLightmapForColor(color, scene);
        });
    }

    /**
     * Creates a lightmap texture with simulated lighting
     * Uses radial gradient to simulate top-left directional light
     * @param color Base color
     * @param scene BabylonJS scene
     * @param resolution Texture size
     * @returns DynamicTexture with baked lighting gradient
     */
    private static createLightmap(
        color: Color3,
        scene: Scene,
        resolution: number
    ): DynamicTexture {
        const texture = new DynamicTexture(
            `lightmap-${color.toHexString()}`,
            resolution,
            scene,
            false // generateMipMaps
        );

        const ctx = texture.getContext();
        const canvas = ctx.canvas.getContext('2d') as CanvasRenderingContext2D;

        // Create radial gradient simulating directional light from top-left
        // Offset the gradient center to create directional effect
        const centerX = resolution * 0.4; // Offset left
        const centerY = resolution * 0.4; // Offset up
        const radius = resolution * 0.8;  // Larger radius for smoother falloff

        const gradient = canvas.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );

        // Calculate lit and shadow colors
        // Lit area: 1.5x brighter than base color (clamped to 1.0)
        const litColor = new Color3(
            Math.min(color.r * 1.5, 1.0),
            Math.min(color.g * 1.5, 1.0),
            Math.min(color.b * 1.5, 1.0)
        );

        // Shadow area: 0.3x darker than base color
        const shadowColor = color.scale(0.3);

        // Mid-tone: base color unchanged
        const midColor = color;

        // Build gradient with multiple stops for smoother transition
        gradient.addColorStop(0, litColor.toHexString());      // Center: bright
        gradient.addColorStop(0.5, midColor.toHexString());    // Mid: base color
        gradient.addColorStop(1.0, shadowColor.toHexString()); // Edge: dark

        // Fill canvas with gradient
        canvas.fillStyle = gradient;
        canvas.fillRect(0, 0, resolution, resolution);

        // Update texture with canvas content
        texture.update();

        return texture;
    }

    /**
     * Clears the lightmap cache
     * Useful for memory management or when regenerating lightmaps
     */
    public static clearCache(): void {
        this.lightmapCache.forEach(texture => texture.dispose());
        this.lightmapCache.clear();
    }

    /**
     * Gets the current cache size
     * @returns Number of cached lightmaps
     */
    public static getCacheSize(): number {
        return this.lightmapCache.size;
    }
}

import {Color3, DynamicTexture, HemisphericLight, PointLight, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";
import {RenderingMode} from "./renderingMode";

export class LightmapGenerator {
    private static lightmapCache: Map<string, DynamicTexture> = new Map();
    private static readonly DEFAULT_RESOLUTION = 512;

    // Toggle to enable/disable lightmap usage (for performance testing)
    public static ENABLED = true;

    // Current rendering mode
    private static currentMode: RenderingMode = RenderingMode.UNLIT_WITH_EMISSIVE_TEXTURE;

    // Scene lights for DIFFUSE_WITH_LIGHTS mode
    private static hemisphericLight?: HemisphericLight;
    private static pointLight?: PointLight;

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

    /**
     * Sets the rendering mode
     * @param mode The rendering mode to use
     */
    public static setRenderingMode(mode: RenderingMode): void {
        this.currentMode = mode;
    }

    /**
     * Gets the current rendering mode
     * @returns Current rendering mode
     */
    public static getRenderingMode(): RenderingMode {
        return this.currentMode;
    }

    /**
     * Applies the specified rendering mode to a material
     * @param material The material to update
     * @param color The base color
     * @param mode The rendering mode to apply
     * @param scene The BabylonJS scene
     */
    public static applyRenderingModeToMaterial(
        material: StandardMaterial,
        color: Color3,
        mode: RenderingMode,
        scene: Scene
    ): void {
        // Clear existing textures and properties
        material.diffuseColor = new Color3(0, 0, 0);
        material.emissiveColor = new Color3(0, 0, 0);
        material.diffuseTexture = null;
        material.emissiveTexture = null;
        material.lightmapTexture = null;

        switch (mode) {
            case RenderingMode.LIGHTMAP_WITH_LIGHTING:
                // Use diffuseColor + lightmapTexture with lighting enabled
                material.diffuseColor = color;
                material.lightmapTexture = this.generateLightmapForColor(color, scene);
                material.useLightmapAsShadowmap = false;
                material.disableLighting = false;
                break;

            case RenderingMode.UNLIT_WITH_EMISSIVE_TEXTURE:
                // Use emissiveColor + emissiveTexture with lighting disabled
                material.emissiveColor = color;
                material.emissiveTexture = this.generateLightmapForColor(color, scene);
                material.disableLighting = true;
                break;

            case RenderingMode.FLAT_EMISSIVE:
                // Use only emissiveColor with lighting disabled
                material.emissiveColor = color;
                material.disableLighting = true;
                break;

            case RenderingMode.DIFFUSE_WITH_LIGHTS:
                // Use diffuseColor with dynamic lighting enabled
                material.diffuseColor = color;
                material.disableLighting = false;
                break;
        }
    }

    /**
     * Creates or enables scene lights for DIFFUSE_WITH_LIGHTS mode
     * @param scene The BabylonJS scene
     */
    private static createSceneLights(scene: Scene): void {
        if (!this.hemisphericLight) {
            this.hemisphericLight = new HemisphericLight("renderModeHemiLight", new Vector3(0, 1, 0), scene);
            this.hemisphericLight.intensity = 0.7;
        }

        if (!this.pointLight) {
            this.pointLight = new PointLight("renderModePointLight", new Vector3(2, 3, 2), scene);
            this.pointLight.intensity = 0.8;
        }

        this.hemisphericLight.setEnabled(true);
        this.pointLight.setEnabled(true);
    }

    /**
     * Disables scene lights used for DIFFUSE_WITH_LIGHTS mode
     */
    private static disableSceneLights(): void {
        if (this.hemisphericLight) {
            this.hemisphericLight.setEnabled(false);
        }
        if (this.pointLight) {
            this.pointLight.setEnabled(false);
        }
    }

    /**
     * Updates all materials in the scene to use the specified rendering mode
     * @param scene The BabylonJS scene
     * @param mode The rendering mode to apply
     */
    public static updateAllMaterials(scene: Scene, mode: RenderingMode): void {
        this.currentMode = mode;

        // Enable or disable scene lights based on mode
        if (mode === RenderingMode.DIFFUSE_WITH_LIGHTS) {
            this.createSceneLights(scene);
        } else {
            this.disableSceneLights();
        }

        scene.materials.forEach(material => {
            if (material instanceof StandardMaterial) {
                // Skip UI materials (buttons, handles, and labels use emissiveTexture with text rendering)
                if (material.name === 'buttonMat' ||
                    material.name === 'handleMaterial' ||
                    material.name === 'text-mat' ||
                    material.id.includes('button') ||
                    material.id.includes('handle') ||
                    material.id.includes('text')) {
                    return;
                }

                // Try to determine the base color from existing material
                let baseColor: Color3;

                if (material.emissiveColor && material.emissiveColor.toLuminance() > 0) {
                    baseColor = material.emissiveColor.clone();
                } else if (material.diffuseColor && material.diffuseColor.toLuminance() > 0) {
                    baseColor = material.diffuseColor.clone();
                } else {
                    // Skip materials without a color set
                    return;
                }

                this.applyRenderingModeToMaterial(material, baseColor, mode, scene);
            }
        });
    }
}

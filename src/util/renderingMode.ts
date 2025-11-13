/**
 * Rendering modes for materials in the scene
 *
 * LIGHTMAP_WITH_LIGHTING: Uses diffuseColor + lightmapTexture with lighting enabled
 *   - Provides lighting illusion with actual lighting calculations
 *   - Most expensive performance-wise
 *   - disableLighting = false
 *
 * UNLIT_WITH_EMISSIVE_TEXTURE: Uses emissiveColor + emissiveTexture with lighting disabled
 *   - Provides lighting illusion without lighting calculations (current default)
 *   - Best balance of visual quality and performance
 *   - disableLighting = true
 *
 * FLAT_EMISSIVE: Uses only emissiveColor with lighting disabled
 *   - Flat shading, no lighting illusion
 *   - Best performance
 *   - disableLighting = true
 *
 * DIFFUSE_WITH_LIGHTS: Uses diffuseColor with two scene lights enabled
 *   - Real-time lighting calculations with dynamic lights
 *   - Provides realistic lighting and shadows
 *   - disableLighting = false
 */
export enum RenderingMode {
    LIGHTMAP_WITH_LIGHTING = "lightmap_with_lighting",
    UNLIT_WITH_EMISSIVE_TEXTURE = "unlit_with_emissive_texture",
    FLAT_EMISSIVE = "flat_emissive",
    DIFFUSE_WITH_LIGHTS = "diffuse_with_lights"
}

export const RenderingModeLabels = {
    [RenderingMode.LIGHTMAP_WITH_LIGHTING]: "Lightmap + Lighting",
    [RenderingMode.UNLIT_WITH_EMISSIVE_TEXTURE]: "Emissive Texture",
    [RenderingMode.FLAT_EMISSIVE]: "Flat Color",
    [RenderingMode.DIFFUSE_WITH_LIGHTS]: "Diffuse + Lights"
};

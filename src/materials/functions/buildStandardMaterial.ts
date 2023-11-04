import {Color3, Scene, StandardMaterial} from "@babylonjs/core";

export function buildStandardMaterial(name: string, scene: Scene, color: string): StandardMaterial {
    const existingMaterial = scene.getMaterialById(name);
    if (existingMaterial) {
        return (existingMaterial as StandardMaterial);
    }
    const handleMaterial = new StandardMaterial(name, scene);
    handleMaterial.id = name;
    handleMaterial.diffuseColor = Color3.FromHexString(color);
    handleMaterial.alpha = 1;
    return handleMaterial;
}
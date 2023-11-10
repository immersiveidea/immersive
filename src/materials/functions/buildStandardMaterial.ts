import {Color3, Scene, StandardMaterial} from "@babylonjs/core";

export function buildStandardMaterial(name: string, scene: Scene, color: string): StandardMaterial {
    const existingMaterial = scene.getMaterialById(name);
    if (existingMaterial) {
        return (existingMaterial as StandardMaterial);
    }
    const newMaterial = new StandardMaterial(name, scene);
    newMaterial.id = name;
    newMaterial.diffuseColor = Color3.FromHexString(color);
    newMaterial.alpha = 1;
    return newMaterial;
}
import {AbstractMesh, DynamicTexture, Material, MeshBuilder, StandardMaterial} from "@babylonjs/core";
import {DefaultScene} from "../../defaultScene";

function calculateDynamicTextureDimensions(text: string, font: string): {
    DTWidth: number,
    DTHeight: number,
    ratio: number
} {
    const temp = new DynamicTexture("DynamicTexture", 32, DefaultScene.Scene);
    const tmpctx = temp.getContext();
    tmpctx.font = font;
    const DTWidth = tmpctx.measureText(text).width + 8;
    temp.dispose();

    const height = 0.08;
    const DTHeight = 1.5 * 24; //or set as wished
    const ratio = height / DTHeight;

    return {DTWidth, DTHeight, ratio};
}

function createDynamicTexture(text: string, font: string, DTWidth: number, DTHeight: number): DynamicTexture {
    const dynamicTexture = new DynamicTexture("text-text", {
        width: DTWidth,
        height: DTHeight
    }, DefaultScene.Scene, false);
    dynamicTexture.drawText(text, null, null, font, "#ffffff", "#000000", true);
    dynamicTexture.metadata = {exportable: true};
    return dynamicTexture;
}

function createMaterial(dynamicTexture: DynamicTexture): Material {
    const mat = new StandardMaterial("text-mat", DefaultScene.Scene);
    //mat.diffuseColor = Color3.Black();
    mat.disableLighting = false;
    mat.backFaceCulling = false;
    mat.emissiveTexture = dynamicTexture;
    mat.diffuseTexture = dynamicTexture;
    mat.metadata = {exportable: true};
    //mat.freeze();
    return mat;
}

function createPlane(text: string, material: Material, planeWidth: number, height: number): AbstractMesh {
    const plane = MeshBuilder.CreatePlane("text" + text, {width: planeWidth, height: height}, DefaultScene.Scene);
    plane.material = material;
    plane.metadata = {exportable: true};
    return plane;
}

export function createLabel(text: string): AbstractMesh {
    const font_size = 24;
    const font = "bold " + font_size + "px Arial";
    const {DTWidth, DTHeight, ratio} = calculateDynamicTextureDimensions(text, font);
    const dynamicTexture = createDynamicTexture(text, font, DTWidth, DTHeight);
    const material = createMaterial(dynamicTexture);
    const planeWidth = DTWidth * ratio;
    const height = 0.08;
    return createPlane(text, material, planeWidth, height);
}
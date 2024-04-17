import {AbstractMesh, Color3, DynamicTexture, Material, MeshBuilder, StandardMaterial} from "@babylonjs/core";
import log from "loglevel";


const textLogger: log.Logger = log.getLogger('TextLabel');

export function updateTextNode(mesh: AbstractMesh, text: string) {
    if (!mesh) {
        textLogger.error("updateTextNode: mesh is null");
        return null;
    }
    const textNodes = mesh.getChildren((node) => {
        return node.metadata?.text == true;
    });
    if (textNodes && textNodes.length > 0) {
        textNodes.forEach((node) => {
            node.dispose(false, true);
        });
    }

    if (!text) {
        return null;
    }

    //Set font
    const height = 0.05;
    const font_size = 24;
    const font = "bold " + font_size + "px Arial";
    //Set height for dynamic texture
    const DTHeight = 1.5 * font_size; //or set as wished
    //Calc Ratio
    const ratio = height / DTHeight;

    //Use a temporary dynamic texture to calculate the length of the text on the dynamic texture canvas
    const temp = new DynamicTexture("DynamicTexture", 32, mesh.getScene());
    const tmpctx = temp.getContext();
    tmpctx.font = font;
    const DTWidth = tmpctx.measureText(text).width + 8;

    //Calculate width the plane has to be
    const planeWidth = DTWidth * ratio;

    //Create dynamic texture and write the text
    const dynamicTexture = new DynamicTexture("DynamicTexture", {
        width: DTWidth,
        height: DTHeight
    }, mesh.getScene(), false);
    const mat = new StandardMaterial("mat", mesh.getScene());
    mat.diffuseColor = Color3.Black();
    mat.disableLighting = true;
    mat.backFaceCulling = true;
    mat.emissiveTexture = dynamicTexture;
    //mat.emissiveColor = Color3.White();
    dynamicTexture.drawText(text, null, null, font, "#ffffff", "#000000", true);
    //Create plane and set dynamic texture as material
    //const plane = MeshBuilder.CreatePlane("text" + text, {width: planeWidth, height: height}, mesh.getScene());
    const plane1 = createPlane(mat, mesh, text, planeWidth, height);
    const plane2 = createPlane(mat, mesh, text, planeWidth, height);
    plane2.rotation.y = Math.PI;
}

function createPlane(mat: Material, mesh: AbstractMesh, text: string, planeWidth: number, height: number): AbstractMesh {
    const plane = MeshBuilder.CreatePlane("text" + text, {width: planeWidth, height: height}, mesh.getScene());
    const yOffset = mesh.getBoundingInfo().boundingSphere.maximum.y;
    plane.parent = mesh;

    plane.scaling.y = (1 / mesh.scaling.y);
    plane.scaling.x = (1 / mesh.scaling.x);
    plane.scaling.z = (1 / mesh.scaling.z);
    plane.material = mat;
    //plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    plane.metadata = {exportable: true, label: true};
    if (mesh.metadata?.template == "#connection-template") {
        plane.billboardMode = AbstractMesh.BILLBOARDMODE_Y;
        plane.position.y = mesh.position.y + .1;

    } else {
        plane.position.y = yOffset + (height * plane.scaling.y);
    }

    return plane;
}

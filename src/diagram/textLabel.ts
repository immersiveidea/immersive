import {AbstractMesh, Color3, DynamicTexture, Mesh, MeshBuilder, StandardMaterial} from "@babylonjs/core";
import log from "loglevel";

export class TextLabel {
    private static logger: log.Logger = log.getLogger('TextLabel');

    public static updateTextNode(mesh: AbstractMesh, text: string): AbstractMesh {
        if (!mesh) {
            this.logger.error("updateTextNode: mesh is null");
            return null;
        }
        let textNode = (mesh.getChildren((node) => {
            return node.name == 'text'
        })[0] as Mesh);
        if (textNode) {
            textNode.dispose(false, true);
        }
        if (!text) {
            return null;
        }

        //Set font
        const height = 0.125;
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
        mat.diffuseTexture = dynamicTexture;
        mat.emissiveColor = Color3.White();
        dynamicTexture.drawText(text, null, null, font, "#000000", "#ffffff", true);

        //Create plane and set dynamic texture as material
        const plane = MeshBuilder.CreatePlane("text" + text, {width: planeWidth, height: height}, mesh.getScene());
        plane.material = mat;
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        plane.metadata = {exportable: true};

        const yOffset = mesh.getBoundingInfo().boundingSphere.radius;
        plane.parent = mesh;
        plane.position.y = yOffset;
        plane.scaling.y = 1 / mesh.scaling.y;
        plane.scaling.x = 1 / mesh.scaling.x;
        plane.scaling.z = 1 / mesh.scaling.z;
        return plane;
    }
}
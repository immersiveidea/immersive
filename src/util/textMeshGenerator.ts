import {
    Color3,
    DynamicTexture,
    InstancedMesh,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    TransformNode
} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

export class TextMeshGenerator {
    private _scene: Scene;
    private _textMeshes: Map<string, Mesh> = new Map<string, Mesh>();

    constructor() {
        this._scene = DefaultScene.Scene;
        this.initialize();
    }

    public getMesh(input: string): TransformNode {
        const transformNode = new TransformNode("textMesh-" + input, this._scene);
        let x = 0;
        for (const char of input) {
            const mesh = new InstancedMesh("instance_" + input, this._textMeshes.get(char));
            mesh.parent = transformNode;
            x = x + Math.abs(mesh.getBoundingInfo().boundingBox.minimum.x);
            mesh.position.x = x;
            x = x + mesh.getBoundingInfo().boundingBox.maximum.x;
        }
        return transformNode;
    }

    public generateCharMesh(input: string): Mesh {
        console.log("Generating text mesh for: " + input);
        //Set font
        const height = 0.05;
        const font_size = 28;
        const font = "bold " + font_size + "px Arial";
        //Set height for dynamic texture
        const DTHeight = 1.5 * font_size; //or set as wished
        //Calc Ratio
        const ratio = height / DTHeight;

        //Use a temporary dynamic texture to calculate the length of the text on the dynamic texture canvas
        const temp = new DynamicTexture("DynamicTexture", 32, this._scene);
        const tmpctx = temp.getContext();
        tmpctx.font = font;
        const DTWidth = tmpctx.measureText(input).width + 8;

        //Calculate width the plane has to be
        const planeWidth = DTWidth * ratio;
        const dynamicTexture = new DynamicTexture("DynamicTexture", {
            width: DTWidth,
            height: DTHeight
        }, this._scene, false);
        dynamicTexture.drawText(input, null, null, font, "#ffffff", "#000000", true);
        temp.dispose();
        const mat = new StandardMaterial("mat", this._scene);
        mat.diffuseColor = Color3.Black();
        mat.disableLighting = true;
        mat.backFaceCulling = true;
        mat.emissiveTexture = dynamicTexture;
        const plane = MeshBuilder.CreatePlane("character" + input, {width: planeWidth, height: height}, this._scene);
        plane.material = mat;
        return plane;
    }

    private initialize() {
        for (let i = 32; i < 127; ++i) {
            const mesh = this.generateCharMesh(String.fromCharCode(i));
            this._textMeshes.set(String.fromCharCode(i), mesh);
        }
    }


}
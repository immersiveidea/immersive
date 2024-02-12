import {Color3, Scene, StandardMaterial, TransformNode} from "@babylonjs/core";
import {enumKeys} from "../util/functions/enumKeys";
import {ToolType} from "./types/toolType";
import {buildMesh} from "./functions/buildMesh";

export class SimpleToolbox {
    private scene: Scene;
    private transformNode: TransformNode;

    constructor(scene: Scene) {
        this.scene = scene;
        this.transformNode = new TransformNode("SimpleToolbox", this.scene);
    }

    private buildBaseShapes(color: Color3) {
        for (const tool of enumKeys(ToolType)) {
            const mesh = buildMesh(ToolType[tool], id = toolId(tool, (parent.material as StandardMaterial).diffuseColor), this.transformNode);
        }
    }
}
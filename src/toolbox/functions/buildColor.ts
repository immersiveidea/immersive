import {Color3, MeshBuilder, Node, Scene, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";
import {enumKeys} from "../../util/functions/enumKeys";
import {ToolType} from "../types/toolType";
import {buildTool} from "./buildTool";

export function buildColor(color: Color3, scene: Scene, parent: TransformNode, index: number): Node {
    const width = .1;
    const height = .1;
    const material = new StandardMaterial("material-" + color.toHexString(), scene);
    material.diffuseColor = color;
    material.ambientColor = color;
    material.roughness = .1;
    material.maxSimultaneousLights = 1;

    const colorBoxMesh = MeshBuilder.CreatePlane("toolbox-color-" + color.toHexString(), {
        width: width,
        height: height
    }, scene);
    //colorBoxMesh.rotation.x = Math.PI / 2;
    colorBoxMesh.material = material;
    const rowLength = 8;
    colorBoxMesh.position.x = -.45 + ((index % rowLength) / rowLength);
    colorBoxMesh.position.y = -Math.floor(index / rowLength) * .1;

    colorBoxMesh.parent = parent;
    colorBoxMesh.metadata = {tool: 'color'};

    let i = 0;
    const tools = [];
    for (const tool of enumKeys(ToolType)) {
        const newItem = buildTool(ToolType[tool], colorBoxMesh, material);
        if (newItem) {
            //buildColorPicker(scene, color, newItem, material, i, colorChangeObservable);
            newItem.position = new Vector3(calculatePosition(++i), .1, 0);
            tools.push(newItem.id);
        }
    }
    colorBoxMesh.metadata.tools = tools;
    return colorBoxMesh;
}



const GRID_SIZE = 5;

function calculatePosition(i: number) {
    return (i / GRID_SIZE) - .5 - (1 / GRID_SIZE / 2);
}
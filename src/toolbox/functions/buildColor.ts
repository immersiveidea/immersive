import {
    AbstractMesh,
    Color3,
    MeshBuilder,
    Node,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {enumKeys} from "../../util/functions/enumKeys";
import {ToolType} from "../types/toolType";
import {buildTool} from "./buildTool";
import {LightmapGenerator} from "../../util/lightmapGenerator";

export async function buildColor(color: Color3, scene: Scene, parent: TransformNode, index: number, toolMap: Map<string, AbstractMesh>): Promise<Node> {
    const width = .1;
    const height = .1;
    const material = new StandardMaterial("material-" + color.toHexString(), scene);

    if (LightmapGenerator.ENABLED) {
        // Lightmap as emissive texture (lighting illusion, no lighting calculations)
        material.emissiveColor = color;
        material.emissiveTexture = LightmapGenerator.generateLightmapForColor(color, scene);
        material.disableLighting = true;
    } else {
        // Flat emissive-only rendering (no lighting illusion)
        material.emissiveColor = color;
        material.disableLighting = true;
    }

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
    colorBoxMesh.metadata = {tool: 'color', tools: []};

    let i = 0;
    const tools = [];
    for (const tool of enumKeys(ToolType)) {
        const newItem = await buildTool(ToolType[tool], colorBoxMesh, material);
        if (newItem) {
            //buildColorPicker(scene, color, newItem, material, i, colorChangeObservable);
            newItem.position = new Vector3(calculatePosition(++i), .1, 0);
            tools.push(newItem.id);
            toolMap.set(newItem.id, newItem);

            // Validate that tool instance has proper material inheritance
            if (!newItem.material || !newItem.sourceMesh?.material) {
                console.error(`Tool creation validation FAILED for ${newItem.id}:`);
                console.error(`  Tool material: ${!!newItem.material}`);
                console.error(`  Source mesh: ${newItem.sourceMesh?.id}`);
                console.error(`  Source material: ${!!newItem.sourceMesh?.material}`);
            }
        }
    }
    if (colorBoxMesh.metadata) {
        colorBoxMesh.metadata.tools = tools;
    }
    return colorBoxMesh;
}


const GRID_SIZE = 6;

function calculatePosition(i: number) {
    return (i / GRID_SIZE) - .5 - (1 / GRID_SIZE / 2);
}
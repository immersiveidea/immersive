import {Color3, MeshBuilder, Observable, Scene, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";
import {enumKeys} from "../../util/functions/enumKeys";
import {ToolType} from "../types/toolType";
import {buildTool} from "./buildTool";
import {AdvancedDynamicTexture, ColorPicker} from "@babylonjs/gui";

export function buildColor(color: Color3, scene: Scene, parent: TransformNode, index: number,
                           colorChangeObservable: Observable<{ oldColor: string, newColor: string }>) {
    const width = 1;
    const depth = .2;
    const material = new StandardMaterial("material-" + color.toHexString(), scene);
    material.diffuseColor = color;
    const mesh = MeshBuilder.CreateBox("toolbox-color-" + color.toHexString(), {
        width: width,
        height: .01,
        depth: depth
    }, this.scene);
    mesh.material = material;
    mesh.position.z = index / 4;
    mesh.parent = parent;
    mesh.metadata = {tool: 'color'};
    let i = 0;
    for (const tool of enumKeys(ToolType)) {
        const newItem = buildTool(ToolType[tool], mesh);
        if (newItem) {
            newItem.position = new Vector3(calculatePosition(++i), .1, 0);
        }
    }
    const colorPickerPlane = MeshBuilder
        .CreatePlane("colorPickerPlane",
            {
                width: .1,
                height: .1
            }, scene);
    const colorPickerTexture = AdvancedDynamicTexture.CreateForMesh(colorPickerPlane, 1024, 1024);
    colorPickerPlane.parent = mesh;
    colorPickerPlane.position = new Vector3(calculatePosition(++i), .1, 0);


    const colorPicker = new ColorPicker("color-picker");
    colorPicker.scaleY = 5;
    colorPicker.scaleX = 5;
    colorPicker.value = color;
    colorPicker.onValueChangedObservable.add((value) => {
        const oldColor = material.diffuseColor.clone();
        const newColor = value.clone();
        material.diffuseColor = newColor;
        const newColorHex = newColor.toHexString();
        material.id = "material-" + newColorHex;
        material.name = "material-" + newColorHex;
        mesh.id = "toolbox-color-" + newColorHex;
        mesh.name = "toolbox-color-" + newColorHex;
        colorChangeObservable.notifyObservers({
            oldColor: oldColor.toHexString(),
            newColor: newColor.toHexString()
        });
    });

    colorPickerTexture.addControl(colorPicker);

}

const GRID_SIZE = 5;

function calculatePosition(i: number) {
    return (i / GRID_SIZE) - .5 - (1 / GRID_SIZE / 2);
}
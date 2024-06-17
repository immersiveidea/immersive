import {AbstractMesh, Color3, InstancedMesh, Material, PBRMaterial, StandardMaterial, Vector3} from "@babylonjs/core";
import {ToolType} from "../types/toolType";
import {buildMesh} from "./buildMesh";

const WIDGET_SIZE = .1;

export async function buildTool(tool: ToolType, colorParent: AbstractMesh, material: Material) {
    let id = "ID";
    let color = "#000000";
    switch (material.getClassName()) {
        case "StandardMaterial":
            id = toolId(tool, (material as StandardMaterial).diffuseColor);
            color = (material as StandardMaterial).diffuseColor.toHexString();
            break;
        case "PBRMaterial":
            id = toolId(tool, (material as PBRMaterial).albedoColor);
            color = (material as PBRMaterial).albedoColor.toHexString();
            break;
        default:
            this.logger.warn("buildTool: parent.material is null");
    }


    const newItem = await buildMesh(tool, `tool-${id}`, colorParent.getScene());
    if (!newItem) {
        return null;
    }
    newItem.material = material;
    if (tool === ToolType.PLANE) {
        newItem.material.backFaceCulling = false;
    }
    newItem.scaling = new Vector3(WIDGET_SIZE,
        WIDGET_SIZE,
        WIDGET_SIZE);
    newItem.parent = colorParent.parent;
    newItem.metadata = {template: tool, tool: true, grabClone: true, color: color};
    const instance = new InstancedMesh("tool-instance-" + id, newItem);
    instance.metadata = {template: tool, tool: true, grabClone: true, color: color};
    instance.parent = colorParent.parent;
    instance.setEnabled(false);
    newItem.setEnabled(false);
    /*
    newItem.onEnabledStateChangedObservable.add(() => {

        instance.setEnabled(false);
    });

     */
    return instance;

}

function toolId(tool: ToolType, color: Color3) {
    return tool + "-" + color.toHexString();
}
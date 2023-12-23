import {AbstractMesh, Color3, InstancedMesh, PBRMaterial, StandardMaterial, Vector3} from "@babylonjs/core";
import {ToolType} from "../types/toolType";
import {buildMesh} from "./buildMesh";

const WIDGET_SIZE = .1;

export function buildTool(tool: ToolType, parent: AbstractMesh) {
    let id = "ID";
    switch (parent.material.getClassName()) {

        case "StandardMaterial":
            id = toolId(tool, (parent.material as StandardMaterial).diffuseColor);
            break;
        case "PBRMaterial":
            id = toolId(tool, (parent.material as PBRMaterial).albedoColor);
            break;
        default:
            this.logger.warn("buildTool: parent.material is null");
    }


    const newItem = buildMesh(tool, `tool-${id}`, parent.getScene());
    if (!newItem) {
        return null;
    }
    newItem.material = parent.material;
    if (tool === ToolType.PLANE) {
        newItem.material.backFaceCulling = false;
    }
    newItem.scaling = new Vector3(WIDGET_SIZE,
        WIDGET_SIZE,
        WIDGET_SIZE);
    newItem.parent = parent;
    newItem.metadata = {template: tool, tool: true};
    const instance = new InstancedMesh("instance-" + id, newItem);
    instance.metadata = {template: tool, tool: true};
    instance.parent = parent;
    newItem.setEnabled(false);
    newItem.onEnabledStateChangedObservable.add(() => {
        instance.setEnabled(false);
    });
    return instance;

}

function toolId(tool: ToolType, color: Color3) {
    return tool + "-" + color.toHexString();
}
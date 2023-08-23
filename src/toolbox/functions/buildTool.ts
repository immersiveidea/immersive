import {AbstractMesh, Color3, InstancedMesh, StandardMaterial, Vector3} from "@babylonjs/core";
import {ToolType} from "../types/toolType";
import {buildMesh} from "./buildMesh";

const WIDGET_SIZE = .1;

export function buildTool(tool: ToolType, parent: AbstractMesh) {
    const id = this.toolId(tool, (parent.material as StandardMaterial).diffuseColor);

    const newItem = buildMesh(tool, `tool-${id}`);
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
    newItem.metadata = {template: tool};
    const instance = new InstancedMesh("instance-" + id, newItem);
    instance.metadata = {template: tool};
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
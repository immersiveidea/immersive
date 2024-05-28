import {AbstractMesh} from "@babylonjs/core";
import {MeshTypeEnum} from "../../diagram/types/meshTypeEnum";
import {Toolbox} from "../../toolbox/toolbox";
import {handleWasGrabbed} from "./handleWasGrabbed";
import {DiagramManager} from "../../diagram/diagramManager";

export function getMeshType(mesh: AbstractMesh, diagramManager: DiagramManager): MeshTypeEnum {
    if (Toolbox.instance.isTool(mesh)) {
        return MeshTypeEnum.TOOL;
    }
    if (handleWasGrabbed(mesh)) {
        return MeshTypeEnum.HANDLE;
    }
    if (diagramManager.isDiagramObject(mesh)) {
        return MeshTypeEnum.ENTITY;
    }
    return null;
}

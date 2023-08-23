import {ToolType} from "../types/toolType";
import {Mesh, MeshBuilder} from "@babylonjs/core";

export function buildMesh(type: ToolType, toolname: string): Mesh {
    switch (type) {
        case ToolType.BOX:
            return MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1}, this.scene);

        case ToolType.SPHERE:
            return MeshBuilder.CreateSphere(toolname, {diameter: 1}, this.scene);

        case ToolType.CYLINDER:
            return MeshBuilder.CreateCylinder(toolname, {height: 1, diameter: 1}, this.scene);

        case ToolType.CONE:
            return MeshBuilder.CreateCylinder(toolname, {
                diameterTop: 0,
                height: 1,
                diameterBottom: 1
            }, this.scene);

        case ToolType.PLANE:
            return MeshBuilder.CreatePlane(toolname, {width: 1, height: 1}, this.scene);

        case ToolType.OBJECT:
            return null;

    }
}
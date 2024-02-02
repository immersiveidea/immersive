import {ToolType} from "../types/toolType";
import {Mesh, MeshBuilder, Scene} from "@babylonjs/core";

export function buildMesh(type: ToolType, toolname: string, scene: Scene): Mesh {
    switch (type) {
        case ToolType.BOX:
            return MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1}, scene);

        case ToolType.SPHERE:
            return MeshBuilder.CreateIcoSphere(toolname, {subdivisions: 5, radius: .5}, scene);
        //return MeshBuilder.CreateSphere(toolname, {diameter: 1}, scene);

        case ToolType.CYLINDER:
            return MeshBuilder.CreateCylinder(toolname, {height: 1, diameter: 1, subdivisions: 1, tessellation: 12}, scene);

        case ToolType.CONE:
            return MeshBuilder.CreateCylinder(toolname, {
                diameterTop: 0,
                subdivisions: 1,
                height: 1,
                diameterBottom: 1,
                tessellation: 12
            }, scene);

        case ToolType.PLANE:
            return MeshBuilder.CreatePlane(toolname, {width: 1, height: 1}, scene);

        case ToolType.OBJECT:
            return null;

    }
}
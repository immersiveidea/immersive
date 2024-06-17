import {ToolType} from "../types/toolType";
import {Mesh, MeshBuilder, Scene, SceneLoader} from "@babylonjs/core";
import {DefaultScene} from "../../defaultScene";

const detail = {
    tesselation: 16,
    subdivisions: 5
}

export async function buildMesh(type: ToolType, toolname: string, scene: Scene): Promise<Mesh> {
    switch (type) {
        case ToolType.BOX:
            return MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1}, scene);

        case ToolType.SPHERE:
            return MeshBuilder.CreateIcoSphere(toolname, {
                subdivisions: detail.subdivisions,
                radius: .5,
                flat: false
            }, scene);
        //return MeshBuilder.CreateSphere(toolname, {diameter: 1}, scene);

        case ToolType.CYLINDER:
            return MeshBuilder.CreateCylinder(toolname, {
                height: 1,
                diameter: 1,
                subdivisions: 1,
                tessellation: detail.tesselation
            }, scene);

        case ToolType.CONE:
            return MeshBuilder.CreateCylinder(toolname, {
                diameterTop: 0,
                subdivisions: 1,
                height: 1,
                diameterBottom: 1,
                tessellation: detail.tesselation
            }, scene);
        case ToolType.PERSON:
            const result = await SceneLoader.ImportMeshAsync(null, '/assets/models/', 'person.stl', DefaultScene.Scene);
            result.meshes[0].id = toolname;
            result.meshes[0].name = toolname;
            return result.meshes[0] as Mesh;
        case ToolType.PLANE:
            return MeshBuilder.CreatePlane(toolname, {width: 1, height: 1}, scene);

        case ToolType.OBJECT:
            return null;

    }
}
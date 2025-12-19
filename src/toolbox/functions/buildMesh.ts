import {ToolType} from "../types/toolType";
import {AssetContainer, LoadAssetContainerAsync, Mesh, MeshBuilder} from "@babylonjs/core";
import {DefaultScene} from "../../defaultScene";
import log from "loglevel";

const detail = {
    tesselation: 16,
    subdivisions: 5
}

// Cache the loading promise to prevent multiple fetches and handle concurrent requests
let personAssetContainerPromise: Promise<AssetContainer> | null = null;
export async function buildMesh(type: ToolType, toolname: string): Promise<Mesh> {
    const logger = log.getLogger('buildMesh');
    const scene = DefaultScene.Scene;
    switch (type) {
        case ToolType.BOX:
            return MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1});

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
            // If not already loading, start loading and cache the promise
            if (!personAssetContainerPromise) {
                logger.debug('Loading person.stl for first time');
                personAssetContainerPromise = LoadAssetContainerAsync(
                    '/assets/models/person.stl',
                    scene
                );
            }

            // All concurrent calls await the same promise
            const container = await personAssetContainerPromise;

            // Create new instance using BabylonJS's built-in instantiation
            const entries = container.instantiateModelsToScene();
            const mesh = entries.rootNodes[0] as Mesh;
            if (!mesh) {
                logger.error('error loading mesh');
                return MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1});
            }
            mesh.setParent(null);
            mesh.id = toolname;
            mesh.name = toolname;

            return mesh;
        case ToolType.PLANE:
            return MeshBuilder.CreatePlane(toolname, {width: 1, height: 1}, scene);

        case ToolType.OBJECT:
            return null;

    }
}
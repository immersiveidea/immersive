import {DiagramEntity} from "./diagramEntity";
import {AbstractMesh, Color3, InstancedMesh, Mesh, Scene, StandardMaterial} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import {Toolbox} from "../toolbox/toolbox";


export class MeshConverter {
    public static toDiagramEntity(mesh: AbstractMesh): DiagramEntity {
        const entity = <DiagramEntity>{};
        if ("new" == mesh?.id) {
            mesh.id = "id" + uuidv4();
        }
        entity.id = mesh.id;
        entity.position = mesh.position;
        entity.rotation = mesh.rotation;
        entity.last_seen = new Date();
        entity.template = mesh?.metadata?.template;
        entity.text = mesh?.metadata?.text;
        entity.scale = mesh.scaling;
        if (mesh.material) {
            entity.color = (mesh.material as any).diffuseColor.toHexString();
        }
        return entity;
    }

    public static fromDiagramEntity(entity: DiagramEntity, scene: Scene): AbstractMesh {
        if (!entity.id) {
            entity.id = "id" + uuidv4();
        }
        let mesh = scene.getMeshById(entity.id);
        if (mesh) {
            console.log('mesh already exists');
        } else {
            mesh = scene.getMeshById("tool-" + entity.template + "-" + entity.color);
            if (mesh) {
                if (mesh.isAnInstance) {
                    console.log('error: mesh is an instance');
                } else {
                    mesh = new InstancedMesh(entity.id, (mesh as Mesh));
                }
            } else {
                console.log('no mesh found for ' + entity.template + "-" + entity.color);
                Toolbox.instance.updateToolbox(entity.color);
                mesh = scene.getMeshById("tool-" + entity.template + "-" + entity.color);
                if (!mesh) {
                    console.log('no mesh found for ' + entity.template + "-" + entity.color);
                } else {
                    mesh = new InstancedMesh(entity.id, (mesh as Mesh));
                }
                //Toolbox.instance.buildTool(Toolbox.getToolTypeFromString(entity.template), entity.color);
            }
        }


        if (mesh) {
            mesh.metadata = {template: entity.template};
            if (entity.text) {
                mesh.metadata.text = entity.text;
            }
            if (entity.position) {
                mesh.position = entity.position;
            }
            if (entity.rotation) {
                mesh.rotation = entity.rotation;
            }
            if (entity.parent) {
                mesh.parent = scene.getNodeById(entity.parent);
            }
            if (entity.scale) {
                mesh.scaling = entity.scale;
            }
            if (!mesh.material) {
                const material = new StandardMaterial("material-" + entity.id, scene);
                material.diffuseColor = Color3.FromHexString(entity.color);
                mesh.material = material;
            }

        }

        return mesh;

    }

}
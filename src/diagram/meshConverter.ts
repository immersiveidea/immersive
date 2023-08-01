import {DiagramEntity} from "./diagramEntity";
import {AbstractMesh, Color3, InstancedMesh, Mesh, Quaternion, Scene, StandardMaterial} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import log from "loglevel";
import {TextLabel} from "./textLabel";

export class MeshConverter {
    private static logger = log.getLogger('MeshConverter');

    public static toDiagramEntity(mesh: AbstractMesh): DiagramEntity {
        if (!mesh) {
            this.logger.error("toDiagramEntity: mesh is null");
            return null;
        }
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
        } else {
            this.logger.error("toDiagramEntity: mesh.material is null");
        }
        return entity;
    }
    public static fromDiagramEntity(entity: DiagramEntity, scene: Scene): AbstractMesh {
        if (!entity) {
            this.logger.error("fromDiagramEntity: entity is null");
            return null;
        }
        if (!entity.id) {
            entity.id = "id" + uuidv4();
        }
        let mesh = scene.getMeshById(entity.id);
        if (mesh) {
            log.debug('mesh already exists');
        } else {
            mesh = scene.getMeshById("tool-" + entity.template + "-" + entity.color);
            if (mesh) {
                if (mesh.isAnInstance) {
                    log.debug('error: mesh is an instance');
                } else {
                    mesh = new InstancedMesh(entity.id, (mesh as Mesh));
                }
            } else {
                log.debug('no mesh found for ' + entity.template + "-" + entity.color);
            }
        }
        if (mesh) {
            mesh.metadata = {template: entity.template};
            if (entity.position) {
                mesh.position = entity.position;
            }
            if (entity.rotation) {
                if (mesh.rotationQuaternion) {
                    mesh.rotationQuaternion = Quaternion.FromEulerAngles(entity.rotation.x, entity.rotation.y, entity.rotation.z);
                } else {
                    mesh.rotation = entity.rotation;
                }
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
            if (entity.text) {
                mesh.metadata.text = entity.text;
                TextLabel.updateTextNode(mesh, entity.text);
            }
        } else {
            this.logger.error("fromDiagramEntity: mesh is null after it should have been created");
        }
        return mesh;
    }
}
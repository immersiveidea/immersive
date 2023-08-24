import {DiagramEntity} from "../diagramEntity";
import {AbstractMesh, Color3, InstancedMesh, Mesh, Quaternion, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import {DiagramConnection} from "../diagramConnection";
import {TextLabel} from "../textLabel";
import log from "loglevel";
import {v4 as uuidv4} from 'uuid';

const logger = log.getLogger('fromDiagramEntity');

export function fromDiagramEntity(entity: DiagramEntity, scene: Scene): AbstractMesh {
    if (!entity) {
        logger.error("fromDiagramEntity: entity is null");
        return null;
    }
    if (!entity.id) {
        entity.id = "id" + uuidv4();
    }
    let mesh: AbstractMesh = scene.getMeshById(entity.id);
    if (mesh) {
        logger.debug(`mesh ${mesh.id} already exists`);
    } else {
        if (entity.template == "#connection-template") {
            const connection: DiagramConnection = new DiagramConnection(entity.from, entity.to, scene);
            logger.debug(`connection.mesh = ${connection.mesh.id}`);
            mesh = connection.mesh;
        } else {
            mesh = scene.getMeshById("tool-" + entity.template + "-" + entity.color);
            if (mesh) {
                if (mesh.isAnInstance) {
                    logger.error(`mesh ${mesh.id} is an instance`);
                } else {
                    mesh = new InstancedMesh(entity.id, (mesh as Mesh));
                }
            } else {
                logger.warn('no mesh found for ' + entity.template + "-" + entity.color);
            }
        }

    }
    if (mesh) {
        mesh.metadata = {template: entity.template};
        if (entity.position) {
            mesh.position = xyztovec(entity.position);
        }
        if (entity.rotation) {
            if (mesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.FromEulerAngles(entity.rotation.x, entity.rotation.y, entity.rotation.z);
            } else {
                mesh.rotation = xyztovec(entity.rotation);
            }
        }
        if (entity.parent) {
            mesh.parent = scene.getNodeById(entity.parent);
        }
        if (entity.scale) {
            mesh.scaling = xyztovec(entity.scale);
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
        if (entity.from) {
            mesh.metadata.from = entity.from;
        }
        if (entity.to) {
            mesh.metadata.to = entity.to;
        }
    } else {
        logger.error("fromDiagramEntity: mesh is null after it should have been created");
    }
    return mesh;
}


function xyztovec(xyz: { x, y, z }): Vector3 {
    return new Vector3(xyz.x, xyz.y, xyz.z);
}
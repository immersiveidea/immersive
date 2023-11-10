import {DiagramEntity} from "../types/diagramEntity";
import {AbstractMesh, InstancedMesh, Mesh, Quaternion, Scene, Vector3} from "@babylonjs/core";
import {DiagramConnection} from "../diagramConnection";
import {TextLabel} from "../../objects/textLabel";
import log from "loglevel";
import {v4 as uuidv4} from 'uuid';
import {buildStandardMaterial} from "../../materials/functions/buildStandardMaterial";

const logger = log.getLogger('fromDiagramEntity');

export function fromDiagramEntity(entity: DiagramEntity, scene: Scene): AbstractMesh {
    if (!entity) {
        logger.error("fromDiagramEntity: entity is null");
        return null;
    }
    if (!entity.id) {
        entity.id = "id" + uuidv4();
    }
    const oldMesh: AbstractMesh = scene.getMeshById(entity.id);
    let newMesh: AbstractMesh;
    if (oldMesh) {
        logger.debug(`mesh ${oldMesh.id} already exists`);
        newMesh = oldMesh;
    } else {
        if (entity.template == "#connection-template") {
            const connection: DiagramConnection = new DiagramConnection(entity.from, entity.to, entity.id, scene);
            logger.debug(`connection.mesh = ${connection.mesh.id}`);
            newMesh = connection.mesh;
        } else {
            const toolMesh = scene.getMeshById("tool-" + entity.template + "-" + entity.color);
            if (toolMesh && !oldMesh) {
                newMesh = new InstancedMesh(entity.id, (toolMesh as Mesh));
                newMesh.metadata = {template: entity.template, exportable: true};
            } else {
                logger.warn('no tool mesh found for ' + entity.template + "-" + entity.color);
            }
        }
    }

    if (newMesh) {
        if (entity.position) {
            newMesh.position = xyztovec(entity.position);
        }
        if (entity.rotation) {
            if (newMesh.rotationQuaternion) {
                newMesh.rotationQuaternion = Quaternion.FromEulerAngles(entity.rotation.x, entity.rotation.y, entity.rotation.z);
            } else {
                newMesh.rotation = xyztovec(entity.rotation);
            }
        }
        if (entity.parent) {
            newMesh.parent = scene.getNodeById(entity.parent);
        }
        if (entity.scale) {
            newMesh.scaling = xyztovec(entity.scale);
        }
        if (!newMesh.material) {
            this.logger.warn("new material created, this shouldn't happen");
            newMesh.material = buildStandardMaterial("material-" + entity.id, scene, entity.color);
        }
        if (entity.text) {
            newMesh.metadata.text = entity.text;
            TextLabel.updateTextNode(newMesh, entity.text);
        }
        if (entity.from) {
            newMesh.metadata.from = entity.from;
        }
        if (entity.to) {
            newMesh.metadata.to = entity.to;
        }
    } else {
        logger.error("fromDiagramEntity: mesh is null after it should have been created");
    }
    return newMesh;
}


function xyztovec(xyz: { x, y, z }): Vector3 {
    return new Vector3(xyz.x, xyz.y, xyz.z);
}
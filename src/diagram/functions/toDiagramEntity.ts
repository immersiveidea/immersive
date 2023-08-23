import {AbstractMesh} from "@babylonjs/core";
import {DiagramEntity} from "../diagramEntity";
import log from "loglevel";
import {v4 as uuidv4} from 'uuid';

const logger = log.getLogger('toDiagramEntity');

export function toDiagramEntity(mesh: AbstractMesh): DiagramEntity {

    if (!mesh) {
        logger.error("toDiagramEntity: mesh is null");
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
    entity.from = mesh?.metadata?.from;
    entity.to = mesh?.metadata?.to;
    entity.scale = mesh.scaling;
    if (mesh.material) {
        entity.color = (mesh.material as any).diffuseColor.toHexString();
    } else {
        logger.error("toDiagramEntity: mesh.material is null");
    }
    return entity;
}
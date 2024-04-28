import {AbstractMesh, Vector3} from "@babylonjs/core";
import {DiagramEntity} from "../types/diagramEntity";
import log from "loglevel";
import {v4 as uuidv4} from 'uuid';


export function toDiagramEntity(mesh: AbstractMesh): DiagramEntity {
    const logger = log.getLogger('toDiagramEntity');
    if (!mesh) {
        logger.error("toDiagramEntity: mesh is null");
        return null;
    }
    const entity = <DiagramEntity>{};
    if ("new" == mesh?.id) {
        mesh.id = "id" + uuidv4();
    }
    entity.id = mesh.id;
    entity.position = vectoxys(mesh.position);
    entity.rotation = vectoxys(mesh.rotation);
    entity.last_seen = new Date();
    entity.template = mesh?.metadata?.template;
    entity.text = mesh?.metadata?.text;
    entity.from = mesh?.metadata?.from;
    entity.to = mesh?.metadata?.to;
    entity.scale = vectoxys(mesh.scaling);
    if (mesh.material) {
        switch (mesh.material.getClassName()) {
            case "StandardMaterial":
                entity.color = (mesh.material as any).diffuseColor.toHexString();
                break;
            case "PBRMaterial":
                entity.color = (mesh.material as any).albedoColor.toHexString();
                break;
        }

    } else {
        if (entity.template != "#object-template") {
            logger.error("toDiagramEntity: mesh.material is null");
        }

    }
    return entity;
}

function vectoxys(v: Vector3): { x, y, z } {
    return {x: v.x, y: v.y, z: v.z};
}
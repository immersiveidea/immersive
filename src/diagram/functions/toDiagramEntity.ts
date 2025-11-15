import {AbstractMesh, InstancedMesh} from "@babylonjs/core";
import {DiagramEntity} from "../types/diagramEntity";
import log from "loglevel";
import {v4 as uuidv4} from 'uuid';
import {vectoxys} from "./vectorConversion";


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
    entity.position = vectoxys(mesh.absolutePosition);
    entity.rotation = vectoxys(mesh.absoluteRotationQuaternion.toEulerAngles());
    entity.last_seen = new Date();
    entity.image = mesh?.metadata?.image;
    entity.template = mesh?.metadata?.template;
    entity.text = mesh?.metadata?.text;
    entity.from = mesh?.metadata?.from;
    entity.to = mesh?.metadata?.to;
    entity.scale = vectoxys(mesh.scaling);

    // Extract color using fallback chain for reliability
    if (mesh.metadata?.color) {
        // Priority 1: Explicit metadata color (most reliable)
        entity.color = mesh.metadata.color;
    } else if (mesh instanceof InstancedMesh && mesh.sourceMesh?.id) {
        // Priority 2: Extract from tool mesh ID (e.g., "tool-BOX-#FF0000")
        const toolId = mesh.sourceMesh.id;
        const parts = toolId.split('-');
        if (parts.length >= 3 && parts[0] === 'tool') {
            const color = parts.slice(2).join('-'); // Handle colors with dashes
            if (color.startsWith('#')) {
                entity.color = color.toLowerCase(); // Normalize to lowercase
            }
        }
    } else if (mesh.material) {
        // Priority 3: Fallback to material extraction (backwards compatibility)
        switch (mesh.material.getClassName()) {
            case "StandardMaterial":
                const stdMat = mesh.material as any;
                const stdColor = stdMat.emissiveColor || stdMat.diffuseColor;
                if (stdColor) {
                    entity.color = stdColor.toHexString()?.toLowerCase();
                }
                break;
            case "PBRMaterial":
                const pbrMat = mesh.material as any;
                const pbrColor = pbrMat.emissiveColor || pbrMat.albedoColor;
                if (pbrColor) {
                    entity.color = pbrColor.toHexString()?.toLowerCase();
                }
                break;
        }
    } else {
        if (entity.template != "#object-template") {
            logger.error("toDiagramEntity: mesh.material is null");
        }
    }

    return entity;
}

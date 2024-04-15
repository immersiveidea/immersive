import {DiagramEvent, DiagramEventType} from "../../diagram/types/diagramEntity";
import {toDiagramEntity} from "../../diagram/functions/toDiagramEntity";
import {AbstractMesh} from "@babylonjs/core";

export function buildDrop(mesh: AbstractMesh): DiagramEvent {
    const entity = toDiagramEntity(mesh);
    return {
        type: DiagramEventType.DROP,
        entity: entity
    }

}
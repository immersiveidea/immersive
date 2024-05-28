import {AbstractMesh, Vector3} from "@babylonjs/core";
import {DiagramManager} from "../../diagram/diagramManager";
import {DiagramObject} from "../../objects/diagramObject";

export function grabAndClone(diagramManager: DiagramManager, mesh: AbstractMesh, parent: AbstractMesh):
    DiagramObject {
    if (diagramManager.isDiagramObject(mesh)) {
        const diagramObject = diagramManager.createCopy(mesh.id);
        if (!diagramObject) {
            return null;
        }
        diagramObject.baseTransform.setParent(parent);
        return diagramObject;
    } else {
        const entity = {
            template: mesh.metadata.template,
            color: mesh.metadata.color,
            position: vectoxys(mesh.absolutePosition),
            rotation: vectoxys(mesh.absoluteRotationQuaternion.toEulerAngles()),
            scale: vectoxys(mesh.scaling)

        }
        const obj = new DiagramObject(parent.getScene(), {diagramEntity: entity});
        obj.baseTransform.setParent(parent);
        return obj;

    }

}

function vectoxys(v: Vector3): { x, y, z } {
    return {x: v.x, y: v.y, z: v.z};
}
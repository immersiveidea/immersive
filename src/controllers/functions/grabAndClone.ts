import {AbstractMesh} from "@babylonjs/core";
import {DiagramManager} from "../../diagram/diagramManager";
import {DiagramObject} from "../../diagram/diagramObject";
import log from "loglevel";
import {vectoxys} from "../../diagram/functions/vectorConversion";

export function grabAndClone(diagramManager: DiagramManager, mesh: AbstractMesh, parent: AbstractMesh):
    DiagramObject {
    const logger = log.getLogger('grabAndClone');
    if (diagramManager.isDiagramObject(mesh)) {
        logger.debug('grabAndClone called with diagram object', mesh.id);
        const diagramObject = diagramManager.createCopy(mesh.id);
        if (!diagramObject) {
            logger.warn('grabAndClone called with invalid diagram object', mesh.id);
            return null;
        }
        diagramObject.baseTransform.setParent(parent);
        diagramManager.addObject(diagramObject);
        return diagramObject;
    } else {
        const entity = {
            template: mesh.metadata.template,
            color: mesh.metadata.color,
            position: vectoxys(mesh.absolutePosition),
            rotation: vectoxys(mesh.absoluteRotationQuaternion.toEulerAngles()),
            scale: vectoxys(mesh.scaling)

        }
        const obj = new DiagramObject(parent.getScene(),
            diagramManager.onDiagramEventObservable,
            {
                diagramEntity: entity,
                actionManager: diagramManager.actionManager
            });
        obj.baseTransform.setParent(parent);
        diagramManager.addObject(obj);
        return obj;

    }

}

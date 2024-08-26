import {viewOnly} from "../../util/functions/getPath";
import {getMeshType} from "../../controllers/functions/getMeshType";
import {MeshTypeEnum} from "../types/meshTypeEnum";
import {grabAndClone} from "../../controllers/functions/grabAndClone";
import {AbstractMesh} from "@babylonjs/core";
import log from "loglevel";
import {DiagramManager} from "../diagramManager";
import {DiagramObject} from "../diagramObject";

export function grabMesh(mesh: AbstractMesh, diagramManager: DiagramManager, controllerMesh: AbstractMesh):
    { grabbedMesh: AbstractMesh | null, grabbedObject: DiagramObject | null, grabbedMeshType: MeshTypeEnum | null } {
    const logger = log.getLogger('grabMesh');
    if (!mesh || viewOnly()) {
        return {grabbedMesh: null, grabbedObject: null, grabbedMeshType: null};
    }
    let grabbedMesh = mesh;
    let grabbedObject: DiagramObject | null = null;
    let grabbedMeshType = getMeshType(mesh, diagramManager);
    //displayDebug(mesh);
    logger.debug("grabbing " + mesh.id + " type " + grabbedMeshType);
    switch (grabbedMeshType) {
        case MeshTypeEnum.ENTITY:
            const diagramObject = diagramManager.getDiagramObject(mesh.id);
            if (diagramObject.isGrabbable) {
                diagramObject.baseTransform.setParent(controllerMesh);
                diagramObject.grabbed = true;
                grabbedObject = diagramObject;
            }
            break;
        case MeshTypeEnum.HANDLE:
            grabbedMesh.setParent(controllerMesh);
            break;
        case MeshTypeEnum.TOOL:
            const clone = grabAndClone(diagramManager, mesh, controllerMesh);
            grabbedObject = clone;
            grabbedMesh = clone.mesh;
            clone.grabbed = true;
    }
    return {grabbedMesh, grabbedObject, grabbedMeshType};
}
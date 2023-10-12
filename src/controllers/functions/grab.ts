import {AbstractMesh, TransformNode} from "@babylonjs/core";
import {DiagramManager} from "../../diagram/diagramManager";

export function grabAndClone(diagramManager: DiagramManager, mesh: AbstractMesh, parent: AbstractMesh) {
    const newMesh = diagramManager.createCopy(mesh);
    const transformNode = new TransformNode("grabAnchor, this.scene");
    transformNode.id = "grabAnchor";
    transformNode.position = newMesh.position.clone();
    if (newMesh.rotationQuaternion) {
        transformNode.rotationQuaternion = newMesh.rotationQuaternion.clone();
    } else {
        transformNode.rotation = newMesh.rotation.clone();
    }
    transformNode.setParent(parent);
    newMesh.setParent(transformNode);
    return {transformNode: transformNode, newMesh: newMesh};
}
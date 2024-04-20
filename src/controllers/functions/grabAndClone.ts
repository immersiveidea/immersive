import {AbstractMesh, TransformNode} from "@babylonjs/core";
import {DiagramManager} from "../../diagram/diagramManager";
import {DefaultScene} from "../../defaultScene";

export function grabAndClone(diagramManager: DiagramManager, mesh: AbstractMesh, parent: AbstractMesh):
    { transformNode: TransformNode, newMesh: AbstractMesh } {
    const scene = DefaultScene.Scene;
    const newMesh = diagramManager.createCopy(mesh, true);
    const transformNode = new TransformNode("grabAnchor", scene);
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
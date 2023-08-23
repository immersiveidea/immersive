import {AbstractMesh, TransformNode} from "@babylonjs/core";

export function setupTransformNode(mesh: TransformNode, parent: AbstractMesh) {
    const transformNode = new TransformNode("grabAnchor, this.scene");
    transformNode.id = "grabAnchor";
    transformNode.position = mesh.position.clone();
    transformNode.rotationQuaternion = mesh.rotationQuaternion.clone();
    transformNode.setParent(parent);
    return transformNode;
}
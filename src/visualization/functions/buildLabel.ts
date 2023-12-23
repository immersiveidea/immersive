import {AbstractMesh, Mesh, MeshBuilder, TransformNode} from "@babylonjs/core";

const LABEL_HEIGHT = .1;

export function buildLabel(name: string, parent: TransformNode, labelWidth: number): void {
    const scene = parent.getScene();
    const seriesLabel = MeshBuilder.CreatePlane(name + "-label", {
        width: labelWidth,
        height: LABEL_HEIGHT,
        sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    seriesLabel.parent = parent;
    seriesLabel.position.z = LABEL_HEIGHT / 2;
    seriesLabel.position.y = .5;
    seriesLabel.rotation.x = Math.PI / 2;
    seriesLabel.material = (parent as AbstractMesh).material;
}
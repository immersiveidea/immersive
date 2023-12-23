import {Color3, Mesh, MeshBuilder, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";

export function buildContainer(parent: TransformNode, size: Vector3) {
    const scene = parent.getScene();
    if (!scene) {
        return;
    }
    const material = new StandardMaterial("container-material", scene);
    material.diffuseColor = new Color3(.5, .5, .5);

    const floor = MeshBuilder.CreatePlane("floor", {width: size.x, height: size.z, sideOrientation: Mesh.DOUBLESIDE}, scene);
    const left = MeshBuilder.CreatePlane("left", {width: size.z, height: size.y, sideOrientation: Mesh.DOUBLESIDE}, scene);
    const back = MeshBuilder.CreatePlane("back", {width: size.x, height: size.y, sideOrientation: Mesh.DOUBLESIDE}, scene);
    [floor, left, back].forEach((mesh) => {
        mesh.material = material;
        mesh.parent = parent;
    });
    left.position = new Vector3(size.x / 2, size.y / 2, 0);
    back.position = new Vector3(0, size.y / 2, -size.z / 2);
    left.rotation.y = Math.PI / 2;
    floor.rotation.x = Math.PI / 2;
}
import {
    AssetContainer,
    Color3,
    Mesh,
    MeshBuilder,
    Scalar,
    Scene,
    SceneLoader,
    SpotLight,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";


export function createCloset(scene: Scene) {
    const width = 1.8;
    const height = 2.4;
    const material = new StandardMaterial("closet", scene);
    material.maxSimultaneousLights = 10;
    material.diffuseColor = Color3.FromHexString("#ffffee");
    const back = MeshBuilder.CreatePlane("back", {sideOrientation: Mesh.DOUBLESIDE, width: width, height: height}, scene);
    back.position.z = -.9 / 2;
    back.material = material;
    back.position.y = height / 2;
    const left = MeshBuilder.CreatePlane("back", {sideOrientation: Mesh.DOUBLESIDE, width: .9, height: height}, scene);
    const left2 = MeshBuilder.CreatePlane("back", {sideOrientation: Mesh.DOUBLESIDE, width: .15, height: height}, scene);
    left2.position.z = .9 / 2;
    left2.position.x = -width / 2 + .15 / 2;
    left2.position.y = height / 2;
    left.material = material;
    left2.material = material;
    const right = MeshBuilder.CreatePlane("back", {sideOrientation: Mesh.DOUBLESIDE, width: .9, height: height}, scene);
    const right2 = MeshBuilder.CreatePlane("back", {sideOrientation: Mesh.DOUBLESIDE, width: .15, height: height}, scene);
    right2.position.x = width / 2 - .15 / 2;
    right2.position.y = height / 2;
    right2.position.z = .9 / 2;
    right2.material = material
    right.material = material;
    left.position.y = height / 2;
    right.position.y = height / 2;
    left.position.x = width / 2;
    right.position.x = -width / 2;
    left.rotation.y = Math.PI / 2;
    right.rotation.y = Math.PI / 2;
    const front = MeshBuilder.CreatePlane("back", {sideOrientation: Mesh.DOUBLESIDE, width: width - .3, height: .35}, scene);
    front.material = material;
    front.position.y = height - .35 / 2;
    front.position.z = .9 / 2;
    const width2 = width * .9;
    for (let i = 0; i < 5; i++) {
        const l = Scalar.Lerp(-width2 / 2, width2 / 2, (width / 5) * i);
        const light = new SpotLight("light", new Vector3(l, 2, (.9 / 2) - .01),
            new Vector3(0, 0, -1), Math.PI / 1.5, 5, scene);
        light.intensity = .3;
    }

    SceneLoader.LoadAssetContainer("/assets/textures/washer/LG Trom Wash Tower Object Collection_2color/LG Trom Wash Tower_white/", "LG Trom Wash.gltf", scene,
        (container: AssetContainer) => {
            const model = container.instantiateModelsToScene(undefined, false, {doNotInstantiate: true});
            const node = model.rootNodes[0];
            node.scaling.scaleInPlace(.00098);
            node.position.x -= .42;
            const bounds = node.getHierarchyBoundingVectors(true);

        });


}
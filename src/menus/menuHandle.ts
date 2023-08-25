import {AbstractMesh, Color3, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";

export class MenuHandle {
    public mesh: AbstractMesh;
    private menuTransformNode: TransformNode;

    constructor(mesh: TransformNode) {
        this.menuTransformNode = mesh;
        this.buildHandle(mesh.getScene());
    }

    private buildHandle(scene: Scene) {
        const handle = MeshBuilder.CreateCapsule("handle", {
            radius: .05,
            orientation: Vector3.Right(),
            height: .4
        }, scene);
        handle.id = "handle-" + this.menuTransformNode.id + "-mesh";
        const handleMaterial = new StandardMaterial("handle-" + this.menuTransformNode.id, scene);
        handleMaterial.diffuseColor = Color3.FromHexString("#EEEEFF");
        handleMaterial.alpha = .8;
        handle.material = handleMaterial;
        handle.position = Vector3.Zero();
        handle.metadata = {handle: true};
        if (this.menuTransformNode) {
            this.menuTransformNode.setParent(handle);
        }
        this.mesh = handle;
    }
}
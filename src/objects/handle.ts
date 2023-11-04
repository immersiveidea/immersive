import {AbstractMesh, InstancedMesh, Mesh, MeshBuilder, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {buildStandardMaterial} from "../materials/functions/buildStandardMaterial";

export class Handle {
    public mesh: AbstractMesh;
    private readonly transformNode: TransformNode;

    constructor(mesh: TransformNode) {
        this.transformNode = mesh;
        this.buildHandle();
    }

    private buildHandle() {
        const scene: Scene = this.transformNode.getScene();
        const handle = getHandleMesh("handle-" + this.transformNode.id + "-mesh", scene);
        handle.position = Vector3.Zero();
        handle.metadata = {handle: true};
        if (this.transformNode) {
            this.transformNode.setParent(handle);
        }
        this.mesh = handle;
    }
}

function getHandleMesh(name: string, scene: Scene): InstancedMesh {
    const existingBase = scene.getMeshById("base-handle-mesh");
    if (existingBase) {
        return new InstancedMesh(name, (existingBase as Mesh));
    }
    const handle = MeshBuilder.CreateCapsule("base-handle-mesh", {
        radius: .05,
        orientation: Vector3.Right(),
        height: .4
    }, scene);
    handle.setEnabled(false);
    handle.material = buildStandardMaterial('base-handle-material', scene, "#CCCCDD");
    handle.id = "base-handle-mesh";
    return new InstancedMesh(name, (handle as Mesh));
}
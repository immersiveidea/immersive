import {
    Color3,
    Mesh,
    MeshBuilder,
    PhysicsAggregate, PhysicsBody,
    PhysicsShapeType, Quaternion,
    Scene,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";
import {Right} from "./right";
import {Left} from "./left";

export class Rigplatform {
    private scene: Scene;
    public right: Right;
    public left: Left;
    public body: PhysicsBody;
    public rigMesh: Mesh;
    constructor(scene: Scene) {
        this.scene = scene;
        this.rigMesh = MeshBuilder.CreateCylinder("platform", {diameter: 1.5, height: .01}, scene);
        const myMaterial = new StandardMaterial("myMaterial", scene);
        myMaterial.diffuseColor = Color3.Blue();
        this.rigMesh.material = myMaterial;
        this.rigMesh.setAbsolutePosition(new Vector3(0, .1, -3));
        this.rigMesh.visibility=0;
        const rigAggregate =
            new PhysicsAggregate(
                this.rigMesh,
                PhysicsShapeType.CYLINDER,
                { friction: 1, center: Vector3.Zero(), radius: .5, mass: .1, restitution: .1},
                scene);

        rigAggregate.body.setGravityFactor(0);
        this.#fixRotation();
        this.body = rigAggregate.body;
    }

    #fixRotation() {
        this.scene.registerBeforeRender(() => {
            const q = this.rigMesh.rotationQuaternion;
            const e = q.toEulerAngles();
            q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
        });
    }
}
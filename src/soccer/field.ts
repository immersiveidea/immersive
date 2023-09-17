import {InstancedMesh, Mesh, MeshBuilder, Scene, StandardMaterial, Vector2, Vector3} from "@babylonjs/core";
import {Ball} from "./ball";
import {Rigplatform} from "../controllers/rigplatform";

export class Field {
    private readonly scene: Scene;
    private ball: Ball;
    private rig: Rigplatform;
    private goalMesh: Mesh;
    private material: StandardMaterial;

    constructor(scene: Scene) {
        this.scene = scene;
        this.goalMesh = MeshBuilder.CreateCylinder("goalPost", {diameter: .1, height: 1}, this.scene);
        this.material = new StandardMaterial("material", this.scene);
        this.material.diffuseColor.set(1, 1, 1);
        this.material.alpha = .5;
        this.goalMesh.material = this.getMaterial();
        this.goalMesh.setEnabled(false);
        this.buildField();
    }

    public addBall(ball: Ball) {
        this.ball = ball;
    }

    public addRig(rig: Rigplatform) {
        this.rig = rig;

    }

    private buildField() {
        const width = .08;
        this.buildLine(new Vector2(35, 0), new Vector2(width, 100));
        this.buildLine(new Vector2(-35, 0), new Vector2(width, 100));
        this.buildLine(new Vector2(-9.16, 50 - 2.75), new Vector2(width, 5.5 - width));
        this.buildLine(new Vector2(9.16, 50 - 2.75), new Vector2(width, 5.5 - width));
        this.buildLine(new Vector2(-9.16, -50 + 2.75), new Vector2(width, 5.5 - width));
        this.buildLine(new Vector2(9.16, -50 + 2.75), new Vector2(width, 5.5 - width));

        this.buildLine(new Vector2(-18.33, 50 - 8.25), new Vector2(width, 16.5 - width));
        this.buildLine(new Vector2(18.33, 50 - 8.25), new Vector2(width, 16.5 - width));
        this.buildLine(new Vector2(-18.33, -50 + 8.25), new Vector2(width, 16.5 - width));
        this.buildLine(new Vector2(18.33, -50 + 8.25), new Vector2(width, 16.5 - width));


        this.buildLine(new Vector2(0, -50), new Vector2(70 - width, width));
        this.buildLine(new Vector2(0, 50), new Vector2(70 - width, width));

        this.buildLine(new Vector2(0, -44.5), new Vector2(18.32 + width, width));
        this.buildLine(new Vector2(0, 44.5), new Vector2(18.32 + width, width));

        this.buildLine(new Vector2(0, -33.5), new Vector2(36.66 + width, width));
        this.buildLine(new Vector2(0, 33.5), new Vector2(36.66 + width, width));

        this.buildCircle(new Vector2(0, 50 - 11));
        this.buildCircle(new Vector2(0, -50 + 11));


        this.buildLine(new Vector2(0, 0), new Vector2(70 - width, width));
        this.buildArc(new Vector2(0, 0));
        this.buildArc(new Vector2(0, 50 - 11), Math.PI / 11, Math.PI / 1.275);
        this.buildArc(new Vector2(0, -50 + 11), Math.PI / 11, (Math.PI / 1.275) - Math.PI);
        this.buildGoalPost(new Vector2(3.66, -50));
        this.buildGoalPost(new Vector2(-3.66, -50));
        this.buildGoalPost(new Vector2(3.66, 50));
        this.buildGoalPost(new Vector2(-3.66, 50));
        this.buildGoalPost(new Vector2(0, 50), false, 7.32, 2.44);
        this.buildGoalPost(new Vector2(0, -50), false, 7.32, 2.44);


    }

    private buildGoalPost(position: Vector2, vertical: boolean = true, length: number = 2.44, y: number = 0) {
        const goalPost = new InstancedMesh("goalPost", this.goalMesh);
        goalPost.position.x = position.x;
        goalPost.position.z = position.y;
        if (!vertical) {
            goalPost.rotation.z = Math.PI / 2;
            goalPost.position.y = y;
        } else {
            goalPost.position.y = length / 2;
        }
        goalPost.scaling.y = length;
        goalPost.visibility = 1;
    }

    private buildCircle(position: Vector2) {
        const circle = MeshBuilder.CreateDisc("disc", {radius: .25, tessellation: 180}, this.scene);
        circle.position.x = position.x;
        circle.position.z = position.y;
        circle.position.y = .01;
        circle.rotation.x = Math.PI / 2;
        circle.material = this.getMaterial();
    }

    private buildArc(position: Vector2, arc: number = Math.PI, rotation: number = 0) {
        const myShape = [
            new Vector3(1, 0, 0),
            new Vector3(1, 0, 1.012),
            new Vector3(.975, 0, 1.012)
        ];
        const circle = MeshBuilder.CreateLathe("lathe", {
            arc: arc,
            shape: myShape, radius: 9.15, tessellation: 180
        }, this.scene);
        circle.material = this.getMaterial();
        circle.position.y = 0.01;
        circle.position.x = position.x;
        circle.position.z = position.y;
        circle.rotation = new Vector3(0, rotation, 0);
    }

    private getMaterial(): StandardMaterial {
        const material = new StandardMaterial("material", this.scene);
        material.diffuseColor.set(1, 1, 1);
        material.alpha = .5;
        return material;
    }

    private buildLine(position: Vector2, shape: Vector2) {
        const line = MeshBuilder.CreatePlane("line", {width: shape.x, height: shape.y}, this.scene);
        line.material = this.getMaterial();
        line.rotation.x = Math.PI / 2;
        line.position.y = .01;
        line.position.x = position.x;
        line.position.z = position.y;
    }
}
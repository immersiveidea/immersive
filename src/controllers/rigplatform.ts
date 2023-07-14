import {
    Angle,
    Camera,
    Color3,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsBody,
    PhysicsMotionType,
    PhysicsShapeType,
    Quaternion,
    Scene,
    StandardMaterial,
    Vector3,
    WebXRDefaultExperience
} from "@babylonjs/core";
import {Right} from "./right";
import {Left} from "./left";
import {Bmenu} from "../menus/bmenu";

export class Rigplatform {
    static LINEAR_VELOCITY = 4;
    static ANGULAR_VELOCITY = 3;
    static x90 = Quaternion.RotationAxis(Vector3.Up(), 1.5708);
    public bMenu: Bmenu;
    private yRotation: number = 0;
    public right: Right;
    public left: Left;
    public body: PhysicsBody;
    public rigMesh: Mesh;
    private camera: Camera;
    private scene: Scene;
    private xr: WebXRDefaultExperience;
    private turning: boolean = false;

    constructor(scene: Scene, xr: WebXRDefaultExperience) {
        this.xr = xr;
        this.bMenu = new Bmenu(scene, this.xr.baseExperience);
        this.camera = scene.activeCamera;

        this.scene = scene;

        this.rigMesh = MeshBuilder.CreateCylinder("platform", {diameter: 1.5, height: .01}, scene);

        for (const cam of this.scene.cameras) {
            cam.parent = this.rigMesh;
        }

        const myMaterial = new StandardMaterial("myMaterial", scene);
        myMaterial.diffuseColor = Color3.Blue();
        this.rigMesh.material = myMaterial;
        this.rigMesh.setAbsolutePosition(new Vector3(0, .1, -3));
        this.rigMesh.visibility = 1;
        const rigAggregate =
            new PhysicsAggregate(
                this.rigMesh,
                PhysicsShapeType.CYLINDER,
                {friction: 1, center: Vector3.Zero(), radius: .5, mass: .1, restitution: .1},
                scene);
        rigAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        rigAggregate.body.setGravityFactor(0);

        this.#fixRotation();
        this.body = rigAggregate.body;
        this.#setupKeyboard();
        this.#initializeControllers();
        this.scene.onActiveCameraChanged.add((s) => {
            this.camera = s.activeCamera;
            this.camera.parent = this.rigMesh;
            console.log('camera changed');
        });
    }

    public forwardback(val: number) {
        const ray = this.camera.getForwardRay();

        this.body.setLinearVelocity(ray.direction.scale(val * -1));
    }

    public leftright(val: number) {


        const ray = this.camera.getForwardRay();
        const direction = ray.direction.applyRotationQuaternion(Rigplatform.x90).scale(val);
        this.body.setLinearVelocity(direction);
        console.log(val);
    }

    public stop() {
        this.body.setLinearVelocity(Vector3.Zero());
        this.body.setAngularVelocity(Vector3.Zero());
    }

    public updown(val: number) {
        let direction = Vector3.Zero();
        this.body.getLinearVelocityToRef(direction);
        direction.y = (val * -1);
        this.body.setLinearVelocity(direction);

    }

    public turn(val: number) {
        const snap = true;
        if (snap) {
            if (!this.turning) {
                if (Math.abs(val) > .1) {
                    this.turning = true;
                    this.yRotation += Angle.FromDegrees(Math.sign(val) * 22.5).radians();
                }

            } else {
                if (Math.abs(val) < .1) {
                    this.turning = false;

                }
            }
        } else {
            if (Math.abs(val) > .1) {
                this.body.setAngularVelocity(Vector3.Up().scale(val));
            } else {
                this.body.setAngularVelocity(Vector3.Zero());
            }
        }

    }

    #initializeControllers() {
        this.xr.input.onControllerAddedObservable.add((source, state) => {
            let controller;
            switch (source.inputSource.handedness) {
                case "right":
                    controller = new Right(source);
                    this.right = controller;
                    controller.setBMenu(this.bMenu);
                    break;
                case "left":
                    controller = new Left(source);
                    this.left = controller;
                    break;

            }
            this.xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            if (controller) {
                controller.setRig(this);
            }

            console.log(source);
            console.log(state);
        });
    }

    //create a method to set the camera to the rig

    #setupKeyboard() {
        ///simplify this with a map

        window.addEventListener("keydown", (ev) => {
            switch (ev.key) {
                case "w":
                    this.forwardback(1 * Rigplatform.LINEAR_VELOCITY);
                    break;
                case "s":
                    this.forwardback(-1 * Rigplatform.LINEAR_VELOCITY);
                    break;
                case "a":
                    this.leftright(1 * Rigplatform.LINEAR_VELOCITY);
                    break;
                case "d":
                    this.leftright(-1 * Rigplatform.LINEAR_VELOCITY);
                    break;
                case "q":
                    this.turn(-1 * Rigplatform.ANGULAR_VELOCITY);
                    break;
                case "e":
                    this.turn(1 * Rigplatform.ANGULAR_VELOCITY);
                    break;
                case "W":
                    this.updown(-1 * Rigplatform.LINEAR_VELOCITY);
                    break;
                case "S":
                    this.updown(1 * Rigplatform.LINEAR_VELOCITY);
                    break;
                case " ":
                    this.bMenu.toggle()
            }

        });
        window.addEventListener("keyup", (ev) => {
            const keys = "wsadqeWS";

            if (keys.indexOf(ev.key) > -1) {
                this.stop();
            }
        });
    }

    #fixRotation() {
        this.scene.registerBeforeRender(() => {
            const q = this.rigMesh.rotationQuaternion;
            const e = q.toEulerAngles();
            e.y += this.yRotation;
            q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
        });
    }
}
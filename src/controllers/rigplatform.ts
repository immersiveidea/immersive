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
import {Controllers} from "./controllers";
import {BmenuState} from "../menus/MenuState";


export class Rigplatform {
    static LINEAR_VELOCITY = 4;
    static ANGULAR_VELOCITY = 3;
    static x90 = Quaternion.RotationAxis(Vector3.Up(), 1.5708);
    public bMenu: Bmenu;
    private scene: Scene;
    public static instance: Rigplatform;
    private static xr: WebXRDefaultExperience;
    private yRotation: number = 0;
    public body: PhysicsBody;
    public rigMesh: Mesh;
    private camera: Camera;
    private turning: boolean = false;

    constructor(scene: Scene, xr: WebXRDefaultExperience) {

        this.scene = scene;
        Rigplatform.xr = xr;
        Rigplatform.instance = this;

        this.bMenu = new Bmenu(scene, xr.baseExperience);
        this.camera = scene.activeCamera;
        this.rigMesh = MeshBuilder.CreateBox("platform", {width: 2, height: .02, depth: 2}, scene);
        //new Hud(this.rigMesh, scene);

        for (const cam of scene.cameras) {
            cam.parent = this.rigMesh;

            //cam.position = new Vector3(0, 1.6, 0);
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
                {friction: 1, center: Vector3.Zero(), radius: .5, mass: 10, restitution: .01},
                scene);
        rigAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        rigAggregate.body.setGravityFactor(.001);


        this.#fixRotation();
        this.body = rigAggregate.body;
        this.#setupKeyboard();
        this.#initializeControllers();
        scene.onActiveCameraChanged.add((s) => {
            this.camera = s.activeCamera;
            this.camera.parent = this.rigMesh;
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
        //console.log(val);
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
        Rigplatform.xr.input.onControllerAddedObservable.add((source) => {
            let controller;
            switch (source.inputSource.handedness) {
                case "right":
                    Right.instance = new Right(source, this.scene, Rigplatform.xr);
                    Controllers.controllerObserver.add((event: { type: string, value: number }) => {
                        switch (event.type) {
                            case "turn":
                                this.turn(event.value);
                                break;
                            case "forwardback":
                                this.forwardback(event.value);
                                break;
                            case "leftright":
                                this.leftright(event.value);
                                break;
                            case "updown":
                                this.updown(event.value);
                                break;
                            case "stop":
                                this.stop();
                                break;
                            case "menu":
                                this.bMenu.toggle();
                                break;
                        }
                    });
                    break;
                case "left":
                    Left.instance = new Left(source, this.scene, Rigplatform.xr);
                    break;

            }
            Rigplatform.xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            if (controller) {
                controller.setRig(this);
            }
        });


    }

    //create a method to set the camera to the rig

    #setupKeyboard() {
        ///simplify this with a map

        window.addEventListener("keydown", (ev) => {
            if (this.bMenu.getState() !== BmenuState.MODIFYING) {
                switch (ev.key) {
                    case "w":
                        this.forwardback(-.1);
                        break;
                    case "s":
                        this.forwardback(.1);
                        break;
                    case "a":
                        this.leftright(-.2);
                        break;
                    case "d":
                        this.leftright(.2);
                        break;
                    case "q":
                        this.turn(-1);
                        break;
                    case "e":
                        this.turn(1);
                        break;
                    case "W":
                        this.updown(-.1);
                        break;
                    case "S":
                        this.updown(.1);
                        break;
                    case " ":

                }
            }

        });
        window.addEventListener("keyup", (ev) => {
            const keys = "wsadqeWS";
            if (keys.indexOf(ev.key) > -1) {
                this.stop();
                this.turn(0);
            }
        });
    }

    #fixRotation() {
        this.scene.registerBeforeRender(() => {
            const q = this.rigMesh.rotationQuaternion;
            this.body.setAngularVelocity(Vector3.Zero());
            if (q) {
                const e = q.toEulerAngles();
                e.y += this.yRotation;
                q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
            }


        });
    }
}
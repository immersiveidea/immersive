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
import {EditMenu} from "../menus/editMenu";
import {Controllers} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {AppConfig} from "../util/appConfig";


export class Rigplatform {
    private velocityIndex = 2;
    private readonly velocityArray = [0.01, 0.1, 1, 2, 5];
    public bMenu: EditMenu;
    private readonly scene: Scene;
    public static instance: Rigplatform;
    private static xr: WebXRDefaultExperience;
    private yRotation: number = 0;
    public body: PhysicsBody;
    public rigMesh: Mesh;
    private camera: Camera;
    private turning: boolean = false;
    private velocity: Vector3 = Vector3.Zero();
    private turnVelocity: number = 0;
    private logger = log.getLogger('Rigplatform');
    private readonly diagramManager: DiagramManager;
    private readonly controllers: Controllers;
    private registered = false;
    private registerVelocityObserver() {
        this.scene.onBeforeRenderObservable.add(() => {
            const vel = this.velocity.applyRotationQuaternion(this.scene.activeCamera.absoluteRotation);
            if (vel.length() > 0) {
                this.logger.debug('Velocity', this.velocity, vel, this.scene.activeCamera.absoluteRotation);
            }
            this.body.setLinearVelocity(vel);
        });
    }
    public forwardback(val: number) {
        this.velocity.z = (val * this.velocityArray[this.velocityIndex])*-1;
    }
    public leftright(val: number) {
        this.velocity.x = (val * this.velocityArray[this.velocityIndex]);
    }
    public updown(val: number) {
        this.velocity.y = (val * this.velocityArray[this.velocityIndex])*-1;
    }
    public turn(val: number) {
        const snap = AppConfig.config.currentTurnSnap.value;

        if (snap > 0) {
            if (!this.turning) {
                if (Math.abs(val) > .1) {
                    this.turning = true;
                    this.yRotation += Angle.FromDegrees(Math.sign(val) * snap).radians();
                }
            } else {
                if (Math.abs(val) < .1) {
                    this.turning = false;
                }
            }
        } else {
            if (Math.abs(val) > .1) {
                this.turnVelocity = val;
            } else {
                this.turnVelocity = 0;
            }
        }
    }

    constructor(scene: Scene, xr: WebXRDefaultExperience, diagramManager: DiagramManager, controllers: Controllers) {

        this.scene = scene;
        this.diagramManager = diagramManager;
        this.controllers = controllers;
        Rigplatform.xr = xr;
        Rigplatform.instance = this;
        this.bMenu = new EditMenu(scene, xr.baseExperience, this.diagramManager);
        this.camera = scene.activeCamera;

        this.rigMesh = MeshBuilder.CreateBox("platform", {width: 2, height: .02, depth: 2}, scene);
        for (const cam of scene.cameras) {
            cam.parent = this.rigMesh;
        }
        const rigMaterial = new StandardMaterial("rigMaterial", scene);
        rigMaterial.diffuseColor = Color3.Blue();
        this.rigMesh.material = rigMaterial;
        this.rigMesh.setAbsolutePosition(new Vector3(0, .1, -3));
        this.rigMesh.visibility = 0;
        const rigAggregate =
            new PhysicsAggregate(
                this.rigMesh,
                PhysicsShapeType.CYLINDER,
                {friction: 1, center: Vector3.Zero(), radius: .5, mass: 10, restitution: .01},
                scene);

        rigAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        rigAggregate.body.setGravityFactor(.001);
        this.fixRotation();
        this.body = rigAggregate.body;

        this.initializeControllers();
        scene.onActiveCameraChanged.add((s) => {
            this.camera = s.activeCamera;
            this.camera.parent = this.rigMesh;
        });
        this.registerVelocityObserver();
    }

    private registerObserver() {
        if (!this.registered) {
            this.registered = true;
            this.controllers.controllerObserver.add((event: { type: string, value: number }) => {
                switch (event.type) {
                    case "increaseVelocity":
                        if (this.velocityIndex < this.velocityArray.length - 1) {
                            this.velocityIndex++;
                        } else {
                            this.velocityIndex = 0;
                        }
                        break;
                    case "decreaseVelocity":
                        if (this.velocityIndex > 0) {
                            this.velocityIndex--;
                        } else {
                            this.velocityIndex = this.velocityArray.length - 1;
                        }
                        break;
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
                        log.warn("Rigplatform", "stop is no longer implemented");
                        break;
                    case "menu":
                        this.bMenu.toggle();
                        break;
                }
            });
        }

    }

    private initializeControllers() {
        Rigplatform.xr.input.onControllerAddedObservable.add((source) => {
            this.registerObserver();
            let controller;
            switch (source.inputSource.handedness) {
                case "right":
                    if (!Right.instance) {
                        Right.instance = new Right(source, this.scene, Rigplatform.xr, this.diagramManager, this.controllers);
                    }
                    break;
                case "left":
                    if (!Left.instance) {
                        Left.instance = new Left(source, this.scene, Rigplatform.xr, this.diagramManager, this.controllers);
                    }

                    break;

            }
            Rigplatform.xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            if (controller) {
                controller.setRig(this);
            }
        });
    }
    private fixRotation() {
        this.scene.registerBeforeRender(() => {
            if (AppConfig?.config?.currentTurnSnap?.value > 0) {
                const q = this.rigMesh.rotationQuaternion;
                this.body.setAngularVelocity(Vector3.Zero());
                if (q) {
                    const e = q.toEulerAngles();
                    e.y += this.yRotation;
                    q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
                }
            } else {
                this.body.setAngularVelocity(Vector3.Up().scale(this.turnVelocity));
            }

        });
    }
}
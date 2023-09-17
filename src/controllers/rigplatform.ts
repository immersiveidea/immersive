import {Angle, Color3, Mesh, MeshBuilder, Quaternion, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {Right} from "./right";
import {Left} from "./left";
import {EditMenu} from "../menus/editMenu";
import {ControllerEvent, ControllerEventType, Controllers} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {buildRig} from "./functions/buildRig";

const RIGHT = "right";
const LEFT = "left";

export class Rigplatform {
    private velocityIndex = 2;
    private readonly velocityArray = [0.01, 0.1, 1, 2, 5];
    public bMenu: EditMenu;
    private readonly scene: Scene;
    public static instance: Rigplatform;
    private rightController: Right;
    private leftController: Left;
    private xr: WebXRDefaultExperience;
    private yRotation: number = 0;
    public rigMesh: Mesh;

    private turning: boolean = false;
    private velocity: Vector3 = Vector3.Zero();
    private turnVelocity: number = 0;
    private logger = log.getLogger('Rigplatform');
    private readonly diagramManager: DiagramManager;
    private readonly controllers: Controllers;
    private registered = false;

    constructor(scene: Scene, xr: WebXRDefaultExperience, diagramManager: DiagramManager, controllers: Controllers) {
        this.scene = scene;
        this.diagramManager = diagramManager;
        this.controllers = controllers;
        this.xr = xr;
        this.bMenu = new EditMenu(scene, xr, this.diagramManager, controllers);
        this.rigMesh = buildRig(scene, this.diagramManager.config);
        this.fixRotation();
        this.initializeControllers();
        scene.onActiveCameraChanged.add((s) => {
            s.activeCamera.parent = this.rigMesh;
        });
        this.registerVelocityObserver();
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
        const snap = this.diagramManager.config.current?.turnSnap;
        if (snap && snap > 0) {
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

    private registerVelocityObserver() {
        this.scene.onBeforeRenderObservable.add(() => {
            const vel = this.velocity.applyRotationQuaternion(this.scene.activeCamera.absoluteRotation);
            if (!this.diagramManager.config.current.flyMode) {
                vel.y = 0;
            }
            if (vel.length() > 0) {
                this.logger.debug('Velocity', this.velocity, vel, this.scene.activeCamera.absoluteRotation);
            }
            this.rigMesh.physicsBody.setLinearVelocity(vel);
        });
    }

    private registerObserver() {
        if (!this.registered) {
            this.registered = true;
            this.controllers.controllerObserver.add((event: ControllerEvent) => {
                switch (event.type) {
                    case ControllerEventType.INCREASE_VELOCITY:
                        if (this.velocityIndex < this.velocityArray.length - 1) {
                            this.velocityIndex++;
                        } else {
                            this.velocityIndex = 0;
                        }
                        break;
                    case ControllerEventType.DECREASE_VELOCITY:
                        if (this.velocityIndex > 0) {
                            this.velocityIndex--;
                        } else {
                            this.velocityIndex = this.velocityArray.length - 1;
                        }
                        break;
                    case ControllerEventType.TURN:
                        this.turn(event.value);
                        break;
                    case ControllerEventType.FORWARD_BACK:
                        this.forwardback(event.value);
                        break;
                    case ControllerEventType.LEFT_RIGHT:
                        this.leftright(event.value);
                        break;
                    case ControllerEventType.UP_DOWN:
                        if (this.diagramManager.config.current.flyMode) {
                            this.updown(event.value);
                        }
                        break;
                    case ControllerEventType.MENU:
                        this.bMenu.toggle();
                        break;
                    case ControllerEventType.MOTION:
                        console.log(JSON.stringify(event));
                        this.buildKickLine(event.startPosition, event.endPosition);
                        break;
                }
            });
        }
    }

    private buildKickLine(start: Vector3, end: Vector3) {
        if (end.y < start.y) {
            const line = MeshBuilder.CreateLines("kickLine", {points: [start, end]}, this.scene);
            line.color = new Color3(1, 0, 0);
            line.isPickable = false;
            setTimeout(() => {
                line.dispose();
            }, 2000);
        }
    }

    private initializeControllers() {
        this.xr.input.onControllerAddedObservable.add((source) => {
            this.registerObserver();
            let controller;
            switch (source.inputSource.handedness) {
                case RIGHT:
                    if (!this.rightController) {
                        this.rightController = new Right(source, this.scene, this.xr, this.diagramManager, this.controllers);
                    }
                    break;
                case LEFT:
                    if (!this.leftController) {
                        this.leftController = new Left(source, this.scene, this.xr, this.diagramManager, this.controllers);
                    }
                    break;
            }
            this.xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            if (controller) {
                controller.setRig(this);
            }
        });
    }
    private fixRotation() {
        this.scene.onAfterPhysicsObservable.add(() => {
            const turnSnap = this.diagramManager.config.current?.turnSnap;
            if (turnSnap && turnSnap > 0) {
                const q = this.rigMesh.rotationQuaternion;
                this.rigMesh.physicsBody.setAngularVelocity(Vector3.Zero());
                if (q) {
                    const e = q.toEulerAngles();
                    e.y += this.yRotation;
                    q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
                }
            } else {
                this.rigMesh.physicsBody.setAngularVelocity(Vector3.Up().scale(this.turnVelocity));
            }
        }, -1, false, this, false);
    }
}
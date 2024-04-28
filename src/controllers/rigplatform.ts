import {Angle, Mesh, Quaternion, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {Right} from "./right";
import {Left} from "./left";
import {ControllerEvent, ControllerEventType, Controllers} from "./controllers";
import log from "loglevel";
import {DiagramManager} from "../diagram/diagramManager";
import {buildRig} from "./functions/buildRig";
import {DefaultScene} from "../defaultScene";

const RIGHT = "right";
const LEFT = "left";



export class Rigplatform {
    private logger = log.getLogger('Rigplatform');
    private readonly controllers: Controllers;
    private readonly diagramManager: DiagramManager;
    private readonly scene: Scene;
    private readonly velocityArray = [0.01, 0.1, 1, 2, 5];
    private readonly xr: WebXRDefaultExperience;

    private rightController: Right;
    private leftController: Left;
    private turning: boolean = false;
    private velocity: Vector3 = Vector3.Zero();
    private velocityIndex: number = 2;
    private turnVelocity: number = 0;

    private registered = false;
    private yRotation: number = 0;

    private _flyMode: boolean = true;

    public static instance: Rigplatform;

    public turnSnap: number = 0;
    public rigMesh: Mesh;

    constructor(
        xr: WebXRDefaultExperience,
                diagramManager: DiagramManager
    ) {
        this.scene = DefaultScene.Scene;
        this.diagramManager = diagramManager;
        this.controllers = diagramManager.controllers;
        this.xr = xr;
        this.rigMesh = buildRig(xr);
        this.fixRotation();
        this.initializeControllers();
        this.registerVelocityObserver();

    }

    public set flyMode(value: boolean) {
        this._flyMode = value;
        if (this._flyMode) {
            this.rigMesh.physicsBody.setGravityFactor(.01);
            this.logger.debug('flymode');
        } else {
            this.rigMesh.physicsBody.setGravityFactor(1);
            this.logger.debug('walkmode');
        }
    }

    public forwardback(val: number) {
        this.velocity.z = (val * this.velocityArray[this.velocityIndex]) * -1;
    }

    public leftright(val: number) {
        this.velocity.x = (val * this.velocityArray[this.velocityIndex]);
    }

    public updown(val: number) {
        this.velocity.y = (val * this.velocityArray[this.velocityIndex]) * -1;
    }

    public turn(val: number) {
        const snap = this.turnSnap;

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
            if (!this._flyMode) {
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
            this.controllers.controllerObservable.add((event: ControllerEvent) => {
                this.logger.debug(event);
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
                        if (this._flyMode) {
                            this.updown(event.value);
                        }
                        break;
                    case ControllerEventType.MOTION:
                        this.logger.debug(JSON.stringify(event));
                        break;
                }
            });
        }
    }


    private initializeControllers() {
        this.xr.input.onControllerAddedObservable.add((source) => {
            this.registerObserver();
            let controller;
            switch (source.inputSource.handedness) {
                case RIGHT:
                    if (!this.rightController) {
                        this.rightController = new Right(source, this.xr, this.diagramManager);
                    }
                    break;
                case LEFT:
                    if (!this.leftController) {
                        this.leftController = new Left(source, this.xr, this.diagramManager);
                    }
                    break;
            }
            //this.xr.baseExperience.camera.position = new Vector3(0, 0, 0);
            if (controller) {
                controller.setRig(this);
            }
        });
    }

    private fixRotation() {
        this.scene.onAfterPhysicsObservable.add(() => {
            const turnSnap = this.turnSnap;
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
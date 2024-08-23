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
    public static instance: Rigplatform;

    public turnSnap: number = 0;
    public rigMesh: Mesh;

    private _logger = log.getLogger('Rigplatform');
    private readonly _controllers: Controllers;
    private readonly _diagramManager: DiagramManager;
    private readonly _scene: Scene;
    private readonly _velocityArray = [0.01, 0.1, 1, 2, 5];
    private readonly _xr: WebXRDefaultExperience;

    private _rightController: Right;
    private _leftController: Left;
    private _turning: boolean = false;
    private _velocity: Vector3 = Vector3.Zero();
    private _velocityIndex: number = 2;
    private _turnVelocity: number = 0;
    private _registered = false;
    private _yRotation: number = 0;

    constructor(
        xr: WebXRDefaultExperience,
        diagramManager: DiagramManager
    ) {
        this._scene = DefaultScene.Scene;
        this._diagramManager = diagramManager;
        this._controllers = diagramManager.controllers;
        this._xr = xr;
        this.rigMesh = buildRig(xr);
        this._fixRotation();
        this._initializeControllers();
        this._registerVelocityObserver();
    }

    private _flyMode: boolean = true;

    public set flyMode(value: boolean) {
        this._flyMode = value;
        if (this._flyMode) {
            this.rigMesh.physicsBody.setGravityFactor(.01);
            this._logger.debug('flymode');
        } else {
            this.rigMesh.physicsBody.setGravityFactor(1);
            this._logger.debug('walkmode');
        }
    }

    public forwardback(val: number) {
        this._velocity.z = (val * this._velocityArray[this._velocityIndex]) * -1;
    }

    public leftright(val: number) {
        this._velocity.x = (val * this._velocityArray[this._velocityIndex]);
    }

    public updown(val: number) {
        this._velocity.y = (val * this._velocityArray[this._velocityIndex]) * -1;
    }

    public turn(val: number) {
        const snap = this.turnSnap;

        if (snap && snap > 0) {
            if (!this._turning) {
                if (Math.abs(val) > .1) {
                    this._turning = true;
                    this._yRotation += Angle.FromDegrees(Math.sign(val) * snap).radians();
                }
            } else {
                if (Math.abs(val) < .1) {
                    this._turning = false;
                }
            }
        } else {
            if (Math.abs(val) > .1) {
                this._turnVelocity = val;
            } else {
                this._turnVelocity = 0;
            }
        }
    }

    private _registerVelocityObserver() {
        this._scene.onBeforeRenderObservable.add(() => {
            const vel = this._velocity.applyRotationQuaternion(this._scene.activeCamera.absoluteRotation);
            if (!this._flyMode) {
                vel.y = 0;
            }
            if (vel.length() > 0) {
                this._logger.debug('Velocity', this._velocity, vel, this._scene.activeCamera.absoluteRotation);
            }
            this.rigMesh.physicsBody.setLinearVelocity(vel);
        });
    }

    private _registerObserver() {
        if (this._registered) {
            this._logger.warn('observer already registered, clearing and re registering');
            this._controllers.controllerObservable.clear();
            this._registered = false;
        }
        if (!this._registered) {
            this._registered = true;
            this._controllers.controllerObservable.add((event: ControllerEvent) => {
                this._logger.debug(event);
                switch (event.type) {
                    case ControllerEventType.INCREASE_VELOCITY:
                        if (this._velocityIndex < this._velocityArray.length - 1) {
                            this._velocityIndex++;
                        } else {
                            this._velocityIndex = 0;
                        }
                        break;
                    case ControllerEventType.DECREASE_VELOCITY:
                        if (this._velocityIndex > 0) {
                            this._velocityIndex--;
                        } else {
                            this._velocityIndex = this._velocityArray.length - 1;
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
                        this._logger.debug(JSON.stringify(event));
                        break;
                }
            });
        } else {
            this._logger.warn('observer already registered');
        }
    }


    private _initializeControllers() {
        this._xr.input.onControllerAddedObservable.add((source) => {
            this._registerObserver();
            switch (source.inputSource.handedness) {
                case RIGHT:
                    if (!this._rightController) {
                        this._rightController = new Right(source, this._xr, this._diagramManager);
                    }
                    break;
                case LEFT:
                    if (!this._leftController) {
                        this._leftController = new Left(source, this._xr, this._diagramManager);
                    }
                    break;
            }
            //this.xr.baseExperience.camera.position = new Vector3(0, 0, 0);
        });
        this._xr.input.onControllerRemovedObservable.add((source) => {
            switch (source.inputSource.handedness) {
                case RIGHT:
                    if (this._rightController) {
                        this._rightController = null;
                    }
                    break;
                case LEFT:
                    if (this._leftController) {
                        this._leftController = null;
                    }
                    break;
            }
            this._logger.debug('controller removed', source);
        });
    }

    private _fixRotation() {
        if (!this._scene) {
            return;
        }
        this._scene.onAfterPhysicsObservable.add(() => {
            const turnSnap = this.turnSnap;
            if (turnSnap && turnSnap > 0) {
                const q = this.rigMesh.rotationQuaternion;
                this.rigMesh.physicsBody.setAngularVelocity(Vector3.Zero());
                if (q) {
                    const e = q.toEulerAngles();
                    e.y += this._yRotation;
                    q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
                }
            } else {
                this.rigMesh.physicsBody.setAngularVelocity(Vector3.Up().scale(this._turnVelocity));
            }
        }, -1, false, this, false);
    }
}
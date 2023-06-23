import {PhysicsBody, Vector3, WebXRCamera, WebXRInputSource} from "@babylonjs/core";

export class Base {
    protected controller: WebXRInputSource;
    protected stickVector: Vector3;
    protected body: PhysicsBody;
    protected camera: WebXRCamera;
    protected speedFactor = 2;
    constructor(controller:
                    WebXRInputSource) {
        this.controller = controller;
    }
    setRig(body: PhysicsBody) {
        this.body = body;
    }
    setCamera(camera: WebXRCamera) {
        this.camera = camera;
    }
    setStickVector(vector: Vector3) {
        this.stickVector = vector;
    }
}
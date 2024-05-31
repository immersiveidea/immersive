import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";

export abstract class AbstractMenu {
    protected handle: Handle;
    protected scene: Scene;
    protected xr: WebXRDefaultExperience;
    protected controllers: Controllers;

    protected constructor(xr: WebXRDefaultExperience, controllers: Controllers) {
        this.scene = DefaultScene.Scene;
        this.xr = xr;
        this.controllers = controllers;
    }

    public toggle() {
        throw new Error("AbstractMenu.toggle() not implemented");
    }
}
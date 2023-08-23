import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";

export class AbstractMenu {
    protected scene: Scene;
    protected xr: WebXRDefaultExperience;
    protected controllers: Controllers;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        this.scene = scene;
        this.xr = xr;
        this.controllers = controllers;
    }

    public toggle() {
        throw new Error("AbstractMenu.toggle() not implemented");
    }

}
import {Scene, WebXRExperienceHelper} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";

export class BaseMenu {
    protected scene: Scene;
    protected xr: WebXRExperienceHelper;
    protected controllers: Controllers;

    constructor(scene: Scene, xr: WebXRExperienceHelper, controllers: Controllers) {
        this.scene = scene;
        this.xr = xr;
        this.controllers = controllers;
    }

}
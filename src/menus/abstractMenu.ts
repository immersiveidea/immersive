import {Scene, TransformNode, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import {MenuHandle} from "./menuHandle";

export class AbstractMenu {
    protected handle: MenuHandle;
    protected scene: Scene;
    protected xr: WebXRDefaultExperience;
    protected controllers: Controllers;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        this.scene = scene;
        this.xr = xr;
        this.controllers = controllers;
    }

    protected createHandle(mesh: TransformNode) {
        this.handle = new MenuHandle(mesh);
    }

    public toggle() {
        throw new Error("AbstractMenu.toggle() not implemented");
    }

}
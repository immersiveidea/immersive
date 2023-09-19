import {Scene, TransformNode, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import {MenuHandle} from "./menuHandle";
import {Button3D, TextBlock} from "@babylonjs/gui";

export abstract class AbstractMenu {
    protected handle: MenuHandle;
    protected scene: Scene;
    protected xr: WebXRDefaultExperience;
    protected controllers: Controllers;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        this.scene = scene;
        this.xr = xr;
        this.controllers = controllers;
    }

    protected makeButton(name: string, id: string) {
        const button = new Button3D(name);
        button.scaling = new Vector3(.1, .1, .1);
        button.name = id;
        const text = new TextBlock(name, name);
        text.fontSize = "48px";
        text.color = "#ffffff";
        text.alpha = 1;
        button.content = text;
        return button;
    }

    protected createHandle(mesh: TransformNode) {
        this.handle = new MenuHandle(mesh);
    }

    public toggle() {
        throw new Error("AbstractMenu.toggle() not implemented");
    }


}
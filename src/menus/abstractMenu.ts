import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";

export abstract class AbstractMenu {
    protected handle: Handle;
    protected scene: Scene;
    protected xr: WebXRDefaultExperience;


    protected constructor(xr: WebXRDefaultExperience) {
        this.scene = DefaultScene.Scene;
        this.xr = xr;
    }

    public toggle() {
        throw new Error("AbstractMenu.toggle() not implemented");
    }
}
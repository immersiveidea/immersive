import {AbstractMenu} from "./abstractMenu";
import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import {makeButton} from "./functions/makeButton";

//a class called SequenceMenu that extends AbstraceMenu and has three buttons labeled '1', '2', and '3'
export class SequenceMenu extends AbstractMenu {
    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.buildMenu();
    }

    private buildMenu() {
        const button1 = makeButton("1", "1");
        const button2 = makeButton("2", "1");
        const button3 = makeButton("3", "1");

    }
}



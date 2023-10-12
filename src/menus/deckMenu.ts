import {AbstractMenu} from "./abstractMenu";
import {Color3, MeshBuilder, Scene, StandardMaterial, Vector2, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";

export class DeckMenu extends AbstractMenu {
    private static instance: DeckMenu;

    public constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.buildMenu();
    }

    private feetToMeters(feet: number, inches: number) {
        return (feet * 12 + inches) * .0254;
    }

    private buildMenu() {
        const base = MeshBuilder.CreateBox("base", {
            width: this.feetToMeters(14, 6),
            height: this.feetToMeters(0, .75),
            depth: this.feetToMeters(14, 6)
        }, this.scene);
        base.position.y = this.feetToMeters(0, .375);
        this.buildPost(new Vector2(7, 3), new Vector2(7, 3));
        this.buildPost(new Vector2(-7, -3), new Vector2(7, 3));
        this.buildPost(new Vector2(-4, -0), new Vector2(7, 3));
        this.buildPost(new Vector2(7 - 4, 3), new Vector2(7, 3));
        this.buildPost(new Vector2(-7, -3), new Vector2(7, 3 - 16));
        this.buildPost(new Vector2(7, 3), new Vector2(7, 3 - 16));

    }

    private buildPost(x: Vector2, y: Vector2) {
        const material = new StandardMaterial("material", this.scene);
        material.diffuseColor = new Color3(.02, .02, .02);
        const base = MeshBuilder.CreateBox("base", {
            width: this.feetToMeters(0, 2.5),
            height: this.feetToMeters(0, 38),
            depth: this.feetToMeters(0, 2.5)
        }, this.scene);
        base.position.y = this.feetToMeters(0, 38 / 2);
        base.position.x = this.feetToMeters(x.x, x.y);
        base.position.z = this.feetToMeters(y.x, y.y);
        base.material = material;
    }
}
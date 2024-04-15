import {AbstractMesh, MeshBuilder, Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import {AbstractMenu} from "./abstractMenu";
import {AdvancedDynamicTexture, Grid, TextBlock} from "@babylonjs/gui";


export class IntegrationMenu extends AbstractMenu {
    private plane: AbstractMesh = null;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.buildMenu();
    }

    public toggle() {
        this.plane.isVisible = !this.plane.isVisible;
    }

    private buildMenu() {
        this.plane = MeshBuilder.CreatePlane("plane", {size: 1}, this.scene);
        const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(this.plane, 1024, 1024, false);

        const grid = new Grid("grid");
        advancedTexture2.addControl(grid);
        grid.addColumnDefinition(.25);
        grid.addColumnDefinition(.75);
        const labelText1 = new TextBlock("labelText1", "New Relic Key");
        grid.addControl(labelText1, 0, 0);
        const labelText2 = new TextBlock("labelText1", "New Relic Account");
        grid.addControl(labelText2, 1, 0);

    }
}
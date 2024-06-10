import {AbstractMenu} from "../menus/abstractMenu";
import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import log, {Logger} from "loglevel";
import {Grid} from "@babylonjs/gui";

export class NewRelicMenu extends AbstractMenu {
    private logger: Logger = log.getLogger('NewRelicMenu');

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.buildMenu();
    }

    buildMenu() {
        this.logger.debug('buildMenu');
        //this.makeButton("credentials", "credentials");
        const grid = new Grid("grid");
        grid.addColumnDefinition(.5);
        grid.addColumnDefinition(.5);
        grid.addRowDefinition(.5);

    }

    private handleClick(_info, state) {
        this.logger.debug("clicked " + state.currentTarget.name);
        switch (state.currentTarget.name) {
            case "credentials":
                break;

        }
    }
}
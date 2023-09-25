import {AbstractMenu} from "../menus/abstractMenu";
import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {Controllers} from "../controllers/controllers";
import log, {Logger} from "loglevel";

export class NewRelicMenu extends AbstractMenu {
    private logger: Logger = log.getLogger('NewRelicMenu');

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
    }

    buildMenu() {
        this.logger.debug('buildMenu');
        this.makeButton("credentials", "credentials");

    }

    makeButton(name: string, id: string) {
        const button = super.makeButton(name, id);
        button.onPointerClickObservable.add(this.handleClick, -1, false, this);
        return button;
    }

    private handleClick(_info, state) {
        this.logger.debug("clicked " + state.currentTarget.name);
        switch (state.currentTarget.name) {
            case "credentials":
                break;

        }
    }
}
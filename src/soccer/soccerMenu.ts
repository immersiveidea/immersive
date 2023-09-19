import {Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {AbstractMenu} from "../menus/abstractMenu";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {GUI3DManager, PlanePanel} from "@babylonjs/gui";
import log, {Logger} from "loglevel";
import {Field} from "./field";

enum SoccerMenuState {
    PLAY,
    PLAN,
    TRAIN,
    NONE

}

export class SoccerMenu extends AbstractMenu {
    private manager: GUI3DManager;
    private state: SoccerMenuState = SoccerMenuState.NONE;
    private readonly field: Field;
    private logger: Logger = log.getLogger('SoccerMenu')

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.field = new Field(this.scene);
        this.manager = new GUI3DManager(this.scene);

        this.controllers.controllerObserver.add((event) => {
            switch (event.type) {
                case ControllerEventType.MOTION:
                    this.field.ball.kick(event.startPosition.clone().subtract(event.endPosition).normalize(), event.duration / 100);
                    break;
                case ControllerEventType.GAZEPOINT:
                    if (event.endPosition) {
                        this.field.gazePoint = event.endPosition.clone();
                    }
                    break;

            }

        });
        this.buildMenu();
    }

    makeButton(name: string, id: string) {
        const button = super.makeButton(name, id);
        button.onPointerClickObservable.add(this.handleClick, -1, false, this);
        return button;
    }

    private buildMenu() {
        const panel = new PlanePanel();
        panel.columns = 4;
        this.manager.addControl(panel);
        panel.addControl(this.makeButton("Play", "play"));
        panel.addControl(this.makeButton("Plan", "plan"));
        panel.addControl(this.makeButton("Train", "Train"));
        panel.addControl(this.makeButton("Modify", "modify"));
        this.manager.rootContainer.children[0].node.position.y = .2;
        this.createHandle(this.manager.rootContainer.children[0].node);
    }

    private handleClick(_info, state) {
        this.logger.debug("clicked " + state.currentTarget.name);
        switch (state.currentTarget.name) {
            case "play":
                this.state = SoccerMenuState.PLAY;
                break;
            case "plan":
                this.state = SoccerMenuState.PLAN;
                break;
            case "train":
                this.state = SoccerMenuState.TRAIN;
                break;
        }

    }

}
import {ActionManager, ExecuteCodeAction, PlaySoundAction, Scene} from "@babylonjs/core";
import {DiaSounds} from "../util/diaSounds";
import {Controllers} from "../controllers/controllers";
import log from "loglevel";

export class DiagramEntityActionManager {
    _actionManager: ActionManager;
    private readonly logger = log.getLogger('DiagramEntityActionManager');

    constructor(scene: Scene, sounds: DiaSounds, controllers: Controllers) {
        this._actionManager = new ActionManager(scene);
        this._actionManager.registerAction(
            new PlaySoundAction(ActionManager.OnPointerOverTrigger, sounds.tick));
        this._actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
                controllers.controllerObserver.notifyObservers({
                    type: 'pulse',
                    gripId: evt?.additionalData?.pickResult?.gripTransform?.id
                })
                this.logger.debug(evt);
            })
        );
    }

    public get manager() {
        return this._actionManager;
    }
}
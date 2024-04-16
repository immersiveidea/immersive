import {ActionManager, ExecuteCodeAction, Scene} from "@babylonjs/core";
import {ControllerEventType, Controllers} from "../../controllers/controllers";
import log from "loglevel";

export function buildEntityActionManager(scene: Scene, controllers: Controllers) {
    const logger = log.getLogger('buildEntityActionManager');
    const actionManager = new ActionManager(scene);
    /*actionManager.registerAction(
        new PlaySoundAction(ActionManager.OnPointerOverTrigger, sounds.tick));*/
    actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
            controllers.controllerObserver.notifyObservers({
                type: ControllerEventType.PULSE,
                gripId: evt?.additionalData?.pickResult?.gripTransform?.id
            })
            logger.debug(evt);
        })
    );
    return actionManager;
}
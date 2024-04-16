import {ActionManager, ExecuteCodeAction} from "@babylonjs/core";
import {ControllerEventType, Controllers} from "../../controllers/controllers";
import log from "loglevel";
import {DefaultScene} from "../../defaultScene";

export function buildEntityActionManager(controllers: Controllers) {
    const logger = log.getLogger('buildEntityActionManager');
    const actionManager = new ActionManager(DefaultScene.scene);
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
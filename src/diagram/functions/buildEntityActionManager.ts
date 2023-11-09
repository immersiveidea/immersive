import {ActionManager, ExecuteCodeAction, PlaySoundAction, Scene} from "@babylonjs/core";
import {ControllerEventType, Controllers} from "../../controllers/controllers";
import {DiaSounds} from "../../util/diaSounds";

export function buildEntityActionManager(scene: Scene, sounds: DiaSounds, controllers: Controllers) {
    const actionManager = new ActionManager(scene);
    actionManager.registerAction(
        new PlaySoundAction(ActionManager.OnPointerOverTrigger, sounds.tick));
    actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
            controllers.controllerObserver.notifyObservers({
                type: ControllerEventType.PULSE,
                gripId: evt?.additionalData?.pickResult?.gripTransform?.id
            })
            this.logger.debug(evt);
        })
    );
    return actionManager;
}
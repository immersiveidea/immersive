import {
    ActionManager,
    Color4,
    ExecuteCodeAction,
    InstancedMesh,
    Observable,
} from "@babylonjs/core";
import log from "loglevel";
import {DefaultScene} from "../../defaultScene";
import {ControllerEventType} from "../../controllers/types/controllerEventType";
import {ControllerEvent} from "../../controllers/types/controllerEvent";

export function buildEntityActionManager(controllerObservable: Observable<ControllerEvent>) {
    const logger = log.getLogger('buildEntityActionManager');
    const actionManager = new ActionManager(DefaultScene.Scene);
    /*actionManager.registerAction(
        new PlaySoundAction(ActionManager.OnPointerOverTrigger, sounds.tick));*/
    actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
            if (evt.meshUnderPointer) {
                try {
                    const mesh = evt.meshUnderPointer as InstancedMesh;

                    // Enable edges rendering on the instance itself (not source mesh)
                    if (!mesh.edgesRenderer) {
                        mesh.enableEdgesRendering(0.99);
                        mesh.edgesWidth = .2;
                        mesh.edgesColor = new Color4(1, 1, 1, 1.0);
                    }
                } catch (e) {
                    logger.error(e);
                }
            }
            controllerObservable.notifyObservers({
                type: ControllerEventType.PULSE,
                gripId: evt?.additionalData?.pickResult?.gripTransform?.id
            });
            logger.debug(evt);
        })
    );
    actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (evt) => {
            try {
                const mesh = evt.source as InstancedMesh;
                // Disable edges rendering on the instance itself
                if (mesh?.edgesRenderer) {
                    mesh.disableEdgesRendering();
                }
            } catch (e) {
                logger.error(e);
            }
            logger.debug(evt);
        })
    );
    return actionManager;
}
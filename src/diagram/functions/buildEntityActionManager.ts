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

                    if (mesh.sourceMesh && !mesh.sourceMesh.edgesRenderer) {
                        // Enable edges rendering on the source mesh
                        mesh.sourceMesh.enableEdgesRendering(0.99);
                        mesh.sourceMesh.edgesWidth = 4.0;
                        mesh.sourceMesh.edgesColor = new Color4(1.5, 1.5, 1.5, 1.0);

                        // Track that edges are enabled
                        mesh.metadata = mesh.metadata || {};
                        mesh.metadata.edgesEnabled = true;
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
                if (mesh.metadata?.edgesEnabled && mesh.sourceMesh?.edgesRenderer) {
                    mesh.sourceMesh.disableEdgesRendering();
                    mesh.metadata.edgesEnabled = false;
                }
            } catch (e) {
                logger.error(e);
            }
            logger.debug(evt);
        })
    );
    return actionManager;
}
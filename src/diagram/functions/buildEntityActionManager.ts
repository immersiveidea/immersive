import {
    ActionManager,
    ExecuteCodeAction,
    HighlightLayer,
    InstancedMesh,
    Observable,
    StandardMaterial,
} from "@babylonjs/core";
import log from "loglevel";
import {DefaultScene} from "../../defaultScene";
import {ControllerEventType} from "../../controllers/types/controllerEventType";
import {ControllerEvent} from "../../controllers/types/controllerEvent";

export function buildEntityActionManager(controllerObservable: Observable<ControllerEvent>) {
    const highlightLayer = new HighlightLayer('highlightLayer', DefaultScene.Scene);
    highlightLayer.innerGlow = false;
    highlightLayer.outerGlow = true;


    const logger = log.getLogger('buildEntityActionManager');
    const actionManager = new ActionManager(DefaultScene.Scene);
    /*actionManager.registerAction(
        new PlaySoundAction(ActionManager.OnPointerOverTrigger, sounds.tick));*/
    actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
            if (evt.meshUnderPointer) {
                try {
                    const mesh = evt.meshUnderPointer as InstancedMesh;
                    //mesh.sourceMesh.renderOutline = true;
                    if (mesh.sourceMesh) {
                        const newMesh = mesh.sourceMesh.clone(mesh.sourceMesh.name + '_clone', null, true);
                        newMesh.metadata = {};
                        newMesh.parent = null;
                        newMesh.position = mesh.absolutePosition;
                        newMesh.rotationQuaternion = mesh.absoluteRotationQuaternion;
                        newMesh.scaling = mesh.scaling;
                        newMesh.setEnabled(true);
                        newMesh.isPickable = false;
                        highlightLayer.addMesh(newMesh, (mesh.sourceMesh.material as StandardMaterial).diffuseColor.multiplyByFloats(1.5, 1.5, 1.5));
                        highlightLayer.setEffectIntensity(newMesh, 1.2);
                        mesh.metadata.highlight = newMesh;
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
                const mesh = evt.source;
                if (mesh.metadata.highlight) {
                    mesh.metadata.highlight.dispose();
                    mesh.metadata.highlight = null;
                }
            } catch (e) {
                logger.error(e);
            }
            logger.debug(evt);
        })
    );
    return actionManager;
}
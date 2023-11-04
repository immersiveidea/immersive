import {Vector3, WebXRDefaultExperience, WebXRState} from "@babylonjs/core";
import log from "loglevel";
import {WebController} from "../../controllers/webController";

export async function groundMeshObserver(ground, scene, diagramManager, controllers, spinner) {
    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [ground],
        disableTeleportation: true,
        outputCanvasOptions: {
            canvasOptions: {
                framebufferScaleFactor: 1
            }
        },
        optionalFeatures: true,
        pointerSelectionOptions: {
            enablePointerSelectionOnAllControllers: true
        }

    });

    if (spinner) {
        spinner.hide();
    }

    xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
        session.addEventListener('visibilitychange', (ev) => {
            this.logger.debug(ev);
        });
    });
    xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state == WebXRState.IN_XR) {
            scene.audioEnabled = true;
            xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            window.addEventListener(('pa-button-state-change'), (event: any) => {
                if (event.detail) {
                    log.debug('App', event.detail);
                }
            });
        }
    });
    import('../../controllers/rigplatform').then((rigmodule) => {
        const rig = new rigmodule.Rigplatform(scene, xr, diagramManager, controllers);
        const webController = new WebController(scene, rig, diagramManager, controllers);
    });
}
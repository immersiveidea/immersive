import {WebXRDefaultExperience, WebXRState} from "@babylonjs/core";
import log from "loglevel";
import {WebController} from "../../controllers/webController";
import {EditMenu} from "../../menus/editMenu";
import {ControllerEventType} from "../../controllers/controllers";
import {ConfigMenu} from "../../menus/configMenu";

export async function groundMeshObserver(ground, scene, diagramManager, controllers, spinner) {
    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [ground],
        disableTeleportation: true,
        disableDefaultUI: true,
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
    xr.baseExperience.onInitialXRPoseSetObservable.add((camera) => {
        //camera.position = new Vector3(0, -1.6, 0);
    });
    const enterButton = (document.querySelector('#enterXR') as HTMLAnchorElement);
    if (enterButton) {
        const vrSupported = await xr.baseExperience.sessionManager.isSessionSupportedAsync('immersive-vr');
        if (vrSupported) {
            enterButton.style.display = "block";
            enterButton.addEventListener('click', (evt) => {
                evt.preventDefault();
                xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
            });
        }

    }

    if (spinner) {
        spinner.hide();
    }

    xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
        session.addEventListener('visibilitychange', (ev) => {
            this.logger.debug(ev);
        });
    });

    xr.baseExperience.onStateChangedObservable.add((state) => {
        switch (state) {
            case WebXRState.IN_XR:
                scene.audioEnabled = true;

                //xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
                //xr.baseExperience.camera.setTarget(new Vector3(0, 1.6, 3));
                window.addEventListener(('pa-button-state-change'), (event: any) => {
                    if (event.detail) {
                        log.debug('App', event.detail);
                    }
                });
                break;

        }

    });
    import('../../controllers/rigplatform').then((rigmodule) => {
        const rig = new rigmodule.Rigplatform(scene, xr, diagramManager, controllers);
        const currentConfig = diagramManager.config.current;
        rig.flyMode = currentConfig.flyMode;
        rig.turnSnap = currentConfig.turnSnap;
        diagramManager.config.onConfigChangedObservable.add((config) => {
            rig.flyMode = config.flyMode;
            rig.turnSnap = config.turnSnap;
        });
        const menu = new EditMenu(scene, xr, diagramManager, controllers);
        controllers.controllerObserver.add((event) => {
            if (event.type == ControllerEventType.MENU) {
                menu.toggle();
            }
        });
        const config = new ConfigMenu(scene, xr, controllers, diagramManager.config);
        const webController = new WebController(scene, rig, diagramManager, controllers);
    });
}
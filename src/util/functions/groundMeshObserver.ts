import {AbstractMesh, WebXRDefaultExperience, WebXRMotionControllerManager, WebXRState} from "@babylonjs/core";
import log from "loglevel";
import {WebController} from "../../controllers/webController";
import {ConfigMenu} from "../../menus/configMenu";
import {Rigplatform} from "../../controllers/rigplatform";
import {DiagramManager} from "../../diagram/diagramManager";
import {Spinner} from "../../objects/spinner";

const logger = log.getLogger('groungMeshObserver');

export async function groundMeshObserver(ground: AbstractMesh,
                                         diagramManager: DiagramManager,
                                         spinner: Spinner) {
    WebXRMotionControllerManager.PrioritizeOnlineRepository = false;
    WebXRMotionControllerManager.UseOnlineRepository = true;
    const xr = await WebXRDefaultExperience.CreateAsync(ground.getScene(), {
        floorMeshes: [ground],
        disableHandTracking: true,
        disableTeleportation: true,
        disableDefaultUI: true,
        disableNearInteraction: true,
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
    const enterButton = (document.querySelector('#enterXR') as HTMLAnchorElement);
    if (enterButton) {
        const vrSupported = await xr.baseExperience.sessionManager.isSessionSupportedAsync('immersive-vr');
        if (vrSupported) {
            enterButton.classList.remove('inactive');
            enterButton.addEventListener('click', (evt) => {
                evt.preventDefault();
                //const voice = new VoiceRecognizer();
                xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
            });
        }

    }

    if (spinner) {
        spinner.hide();
    }

    xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
        session.addEventListener('visibilitychange', (ev) => {
            logger.debug(ev);
        });
    });

    xr.baseExperience.onStateChangedObservable.add((state) => {
        switch (state) {
            case WebXRState.IN_XR:
                ground.getScene().audioEnabled = true;
                window.addEventListener(('pa-button-state-change'), (event: any) => {
                    if (event.detail) {
                        logger.debug(event.detail);
                    }
                });
                break;
        }
    });

    const rig = new Rigplatform(xr, diagramManager);
    const currentConfig = diagramManager.config.current;
    rig.flyMode = currentConfig.flyMode;
    rig.turnSnap = currentConfig.turnSnap;
    diagramManager.config.onConfigChangedObservable.add((config) => {
        rig.flyMode = config.flyMode;
        rig.turnSnap = config.turnSnap;
    });
    const config = new ConfigMenu(ground.getScene(), xr, diagramManager.controllers, diagramManager.config);
    const webController = new WebController(ground.getScene(), rig, diagramManager, diagramManager.controllers);

}
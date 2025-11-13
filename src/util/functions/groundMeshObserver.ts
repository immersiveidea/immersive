import {AbstractMesh, Vector3, WebXRDefaultExperience, WebXRMotionControllerManager, WebXRState} from "@babylonjs/core";
import log from "loglevel";
import {WebController} from "../../controllers/webController";
import {Rigplatform} from "../../controllers/rigplatform";
import {DiagramManager} from "../../diagram/diagramManager";
import {Spinner} from "../../objects/spinner";
import {getAppConfig} from "../appConfig";
import {Scene} from "@babylonjs/core";


export async function groundMeshObserver(ground: AbstractMesh,
                                         diagramManager: DiagramManager,
                                         spinner: Spinner) {
    const logger = log.getLogger('groungMeshObserver');
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
    window.addEventListener('enterXr', async () => {
        await xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
        logger.debug("Entering XR Experience");
    })
    //xr.baseExperience.featuresManager.enableFeature(WebXRFeatureName.LAYERS, "latest", { preferMultiviewOnInit: true }, true, false);

    if (spinner) {
        spinner.hide();
    }

    xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
        session.addEventListener('visibilitychange', (ev) => {
            logger.debug(ev);
        });
    });
    xr.baseExperience.sessionManager.onXRSessionEnded.add(() => {
        logger.debug('session ended');
        window.location.reload();
    });
    xr.baseExperience.onStateChangedObservable.add((state) => {
        logger.debug(WebXRState[state]);
        switch (state) {
            case WebXRState.IN_XR:
                ground.getScene().audioEnabled = true;
                window.addEventListener(('pa-button-state-change'), (event: any) => {
                    if (event.detail) {
                        logger.debug(event.detail);
                    }
                });
                // Position components relative to camera on XR entry
                positionComponentsRelativeToCamera(ground.getScene(), diagramManager);
                break;
            case WebXRState.EXITING_XR:
                setTimeout(() => {
                    logger.debug('EXITING_XR, reloading');
                    window.location.reload();
                }, 500);

        }
    });

    const rig = new Rigplatform(xr, diagramManager);
    const config = getAppConfig();
    rig.flyMode = config.flyModeEnabled;
    rig.turnSnap = parseFloat(config.snapTurnSnap);
    const webController = new WebController(ground.getScene(), rig, diagramManager);

}

function positionComponentsRelativeToCamera(scene: Scene, diagramManager: DiagramManager) {
    const logger = log.getLogger('positionComponentsRelativeToCamera');
    const platform = scene.getMeshByName('platform');
    if (!platform) {
        logger.warn('Platform not found, cannot position components');
        return;
    }

    const camera = scene.activeCamera;
    if (!camera) {
        logger.warn('Active camera not found, cannot position components');
        return;
    }

    // Get camera world position
    const cameraWorldPos = camera.globalPosition;

    // Create a horizontal forward direction from camera's world rotation
    const cameraRotationY = camera.absoluteRotation.toEulerAngles().y;
    const horizontalForward = new Vector3(
        Math.sin(cameraRotationY),
        0,
        Math.cos(cameraRotationY)
    );

    // Create a left direction (perpendicular to forward)
    const horizontalLeft = new Vector3(
        -Math.cos(cameraRotationY),
        0,
        Math.sin(cameraRotationY)
    );

    // Calculate base target world position: 0.5m ahead horizontally and 0.5m below camera Y
    const baseTargetWorldPos = new Vector3(
        cameraWorldPos.x + (horizontalForward.x * 0.5),
        cameraWorldPos.y - 0.5,
        cameraWorldPos.z + (horizontalForward.z * 0.5)
    );

    logger.info('Camera world Y:', cameraWorldPos.y);
    logger.info('Base target world position:', baseTargetWorldPos);

    // Position toolbox: 0.2m to the left of base position
    const toolbox = diagramManager.diagramMenuManager.toolbox;
    if (toolbox && toolbox.handleMesh) {
        const toolboxWorldPos = new Vector3(
            baseTargetWorldPos.x + (horizontalLeft.x * 0.2),
            baseTargetWorldPos.y,
            baseTargetWorldPos.z + (horizontalLeft.z * 0.2)
        );
        const toolboxLocalPos = Vector3.TransformCoordinates(toolboxWorldPos, platform.getWorldMatrix().invert());
        toolbox.handleMesh.position = toolboxLocalPos;
        logger.info('Toolbox positioned at:', toolboxLocalPos);
    }

    // Position input text view: at base position
    const inputTextView = diagramManager.diagramMenuManager['_inputTextView'];
    if (inputTextView && inputTextView.handleMesh) {
        const inputLocalPos = Vector3.TransformCoordinates(baseTargetWorldPos, platform.getWorldMatrix().invert());
        inputTextView.handleMesh.position = inputLocalPos;
        logger.info('InputTextView positioned at:', inputLocalPos);
    }
}
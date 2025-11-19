import {AbstractMesh, Quaternion, Vector3, WebXRDefaultExperience, WebXRMotionControllerManager, WebXRState} from "@babylonjs/core";
import log from "loglevel";
import {WebController} from "../../controllers/webController";
import {Rigplatform} from "../../controllers/rigplatform";
import {DiagramManager} from "../../diagram/diagramManager";
import {Spinner} from "../../objects/spinner";
import {appConfigInstance} from "../appConfig";
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
        // Synchronize desktop camera position with platform before entering XR
        // This prevents the jarring scene shift when transitioning to immersive mode
        const scene = ground.getScene();
        const desktopCamera = scene.activeCamera;
        const platform = scene.getMeshByName('platform');

        if (desktopCamera && platform) {
            // Get desktop camera's world position
            const cameraWorldPos = desktopCamera.globalPosition.clone();

            // Calculate platform position accounting for camera's local offset
            // Camera is at (0, 1.6, 0) in local space relative to cameraTransform
            const platformTargetPos = cameraWorldPos.clone();
            platformTargetPos.y = 0.01; // Platform stays at floor level

            // Subtract camera's local Y offset (1.6m height) from platform position
            const cameraLocalOffset = new Vector3(0, 1.59, 0); // 1.6 - 0.01
            platformTargetPos.subtractInPlace(cameraLocalOffset);

            // Set platform position
            platform.setAbsolutePosition(platformTargetPos);

            // Match platform rotation to desktop camera's viewing direction
            const cameraForward = desktopCamera.getDirection(Vector3.Forward());
            const yaw = Math.atan2(cameraForward.x, cameraForward.z);
            platform.rotationQuaternion = Quaternion.FromEulerAngles(0, yaw, 0);

            // Reset physics velocity to prevent drift on XR entry
            if (platform.physicsBody) {
                platform.physicsBody.setLinearVelocity(Vector3.Zero());
                platform.physicsBody.setAngularVelocity(Vector3.Zero());
            }

            logger.debug("Synchronized camera position before XR entry:", {
                cameraWorldPos: cameraWorldPos.asArray(),
                platformPos: platformTargetPos.asArray(),
                yaw: yaw
            });
        }

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
    const config = appConfigInstance.current;
    rig.flyMode = config.flyMode;
    rig.turnSnap = config.turnSnap;
    const webController = new WebController(ground.getScene(), rig, diagramManager);

    // Set XR on diagram manager so toolbox can create exit button
    diagramManager.setXR(xr);

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

    // Get camera's actual forward direction in world space
    // This accounts for the camera's parent transform rotation (Math.PI on Y)
    const cameraForward = camera.getDirection(Vector3.Forward());
    const horizontalForward = cameraForward.clone();
    horizontalForward.y = 0;  // Keep only horizontal component
    horizontalForward.normalize();  // Ensure unit vector

    // Create a left direction (perpendicular to forward, in world space)
    const horizontalLeft = Vector3.Cross(Vector3.Up(), horizontalForward).normalize();

    logger.info('Camera world position:', cameraWorldPos);
    logger.info('Camera forward (world):', cameraForward);
    logger.info('Horizontal forward:', horizontalForward);
    logger.info('Horizontal left:', horizontalLeft);
    logger.info('Platform world position:', platform.getAbsolutePosition());

    // Position toolbox: Camera-relative positioning disabled to respect default/saved positions
    // Handles now use their configured defaults or saved localStorage positions
    const toolbox = diagramManager.diagramMenuManager.toolbox;
    if (toolbox && toolbox.handleMesh) {
        logger.info('Toolbox handleMesh using default/saved position:', {
            position: toolbox.handleMesh.position.clone(),
            absolutePosition: toolbox.handleMesh.getAbsolutePosition().clone(),
            rotation: toolbox.handleMesh.rotation.clone()
        });

        // Camera-relative positioning commented out - handles use their own defaults
        /*
        // Position at 45 degrees to the left, 0.45m away, slightly below eye level
        // NOTE: User faces -Z direction by design, so negate forward offset
        const forwardOffset = horizontalForward.scale(-0.3);
        const leftOffset = horizontalLeft.scale(0.35);
        const toolboxWorldPos = cameraWorldPos.add(forwardOffset).add(leftOffset);
        toolboxWorldPos.y = cameraWorldPos.y - 0.3;  // Below eye level

        logger.info('Calculated toolbox world position:', toolboxWorldPos);
        logger.info('Forward offset:', forwardOffset);
        logger.info('Left offset:', leftOffset);

        const toolboxLocalPos = Vector3.TransformCoordinates(toolboxWorldPos, platform.getWorldMatrix().invert());
        logger.info('Calculated toolbox local position:', toolboxLocalPos);

        toolbox.handleMesh.position = toolboxLocalPos;

        // Orient toolbox to face the user
        const toolboxToCamera = cameraWorldPos.subtract(toolboxWorldPos).normalize();
        const toolboxYaw = Math.atan2(toolboxToCamera.x, toolboxToCamera.z);
        toolbox.handleMesh.rotation.y = toolboxYaw;

        logger.info('Toolbox handleMesh AFTER positioning:', {
            position: toolbox.handleMesh.position.clone(),
            absolutePosition: toolbox.handleMesh.getAbsolutePosition().clone(),
            rotation: toolbox.handleMesh.rotation.clone()
        });
        */
    }

    // Position input text view: Camera-relative positioning disabled to respect default/saved positions
    // Handles now use their configured defaults or saved localStorage positions
    const inputTextView = diagramManager.diagramMenuManager['_inputTextView'];
    if (inputTextView && inputTextView.handleMesh) {
        logger.info('InputTextView handleMesh using default/saved position:', {
            position: inputTextView.handleMesh.position.clone(),
            absolutePosition: inputTextView.handleMesh.getAbsolutePosition().clone()
        });

        // Camera-relative positioning commented out - handles use their own defaults
        /*
        // NOTE: User faces -Z direction by design, so negate forward offset
        const inputWorldPos = cameraWorldPos.add(horizontalForward.scale(-0.5));
        inputWorldPos.y = cameraWorldPos.y - 0.4;  // Below eye level

        logger.info('Calculated input world position:', inputWorldPos);

        const inputLocalPos = Vector3.TransformCoordinates(inputWorldPos, platform.getWorldMatrix().invert());
        logger.info('Calculated input local position:', inputLocalPos);

        inputTextView.handleMesh.position = inputLocalPos;

        logger.info('InputTextView handleMesh AFTER positioning:', {
            position: inputTextView.handleMesh.position.clone(),
            absolutePosition: inputTextView.handleMesh.getAbsolutePosition().clone()
        });
        */
    }
}
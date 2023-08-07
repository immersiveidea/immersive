import {
    ArcRotateCamera,
    Engine,
    HemisphericLight,
    Scene,
    Vector3,
    WebXRDefaultExperience,
    WebXRState
} from "@babylonjs/core";

import {Rigplatform} from "./controllers/rigplatform";
import {DiagramManager} from "./diagram/diagramManager";
import {Toolbox} from "./toolbox/toolbox";
import log from "loglevel";
import {AppConfig} from "./util/appConfig";
import {PeerjsNetworkConnection} from "./integration/peerjsNetworkConnection";
import {InputTextView} from "./information/inputTextView";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {DrawioManager} from "./integration/drawioManager";

export class App {
    //preTasks = [havokModule];
    constructor() {
        const config = AppConfig.config;
        const logger = log.getLogger('App');
        log.disableAll();
        log.setDefaultLevel('info');

        log.getLogger('App').setLevel('info');
        //log.getLogger('IndexdbPersistenceManager').setLevel('info');
        //log.getLogger('DiagramManager').setLevel('info');

        //log.getLogger('DiagramConnection').setLevel('debug');
        log.getLogger('DrawioManager').setLevel('debug');
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        log.debug('App', 'gameCanvas created');
        this.initialize(canvas).then(() => {
            logger.debug('App', 'Scene Initialized');
        });
    }

    async initialize(canvas) {

        const logger = log.getLogger('App');
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        const environment = new CustomEnvironment(scene);
        const query = Object.fromEntries(new URLSearchParams(window.location.search));
        logger.debug('Query', query);
        if (query.shareCode) {
            scene.onReadyObservable.addOnce(() => {
                logger.debug('Scene ready');
                const identityView = new InputTextView({scene: scene, text: ""});
                identityView.onTextObservable.add((text) => {
                    if (text?.text?.trim() != "") {
                        logger.debug('Identity', text.text);
                        const network = new PeerjsNetworkConnection(query.shareCode, text.text);
                        if (query.host) {
                            network.connect(query.host);
                        }
                    }
                });
                identityView.show();
            });
        }

        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2,
            new Vector3(0, 1.6, 0), scene);
        camera.radius = 0;
        camera.attachControl(canvas, true);
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        environment.groundMeshObservable.add(async (ground) => {
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
            const diagramManager = new DiagramManager(scene, xr.baseExperience);
            const rig = new Rigplatform(scene, xr, diagramManager);
            const toolbox = new Toolbox(scene, xr.baseExperience, diagramManager);
            //const dioManager = new DrawioManager(scene, diagramManager);
            import ('./integration/indexdbPersistenceManager').then((module) => {
                const persistenceManager = new module.IndexdbPersistenceManager("diagram");
                diagramManager.setPersistenceManager(persistenceManager);
                AppConfig.config.setPersistenceManager(persistenceManager);
                persistenceManager.initialize();
            });
        });
        const gamepadManager = new GamepadManager(scene);
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                import("@babylonjs/core/Debug/debugLayer").then(() => {
                    import("@babylonjs/inspector").then(() => {
                        if (scene.debugLayer.isVisible()) {
                            scene.debugLayer.hide();
                        } else {
                            scene.debugLayer.show();
                        }
                    });
                });
            }
        });
        logger.info('keydown event listener added, use Ctrl+Shift+Alt+I to toggle debug layer');
        engine.runRenderLoop(() => {
            scene.render();
        });
        logger.info('Render loop started');
    }
}
const app = new App();




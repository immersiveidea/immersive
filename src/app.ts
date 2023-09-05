import {
    ArcRotateCamera,
    Engine,
    HemisphericLight,
    Scene,
    Vector3,
    WebXRDefaultExperience,
    WebXRState
} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import {Toolbox} from "./toolbox/toolbox";
import log from "loglevel";
import {AppConfig} from "./util/appConfig";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {Controllers} from "./controllers/controllers";
import workerUrl from "./worker?worker&url";
import {DiagramEventType} from "./diagram/diagramEntity";

export class App {
    //preTasks = [havokModule];
    constructor() {
        const logger = log.getLogger('App');
        log.setDefaultLevel('warn');
        //log.getLogger('PeerjsNetworkConnection').setLevel('debug');
        log.getLogger('DiagramManager').setLevel('debug');
        log.getLogger('PeerjsNetworkConnection').setLevel('debug');
        const canvas = document.createElement("canvas");
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        log.debug('App', 'gameCanvas created');
        this.initialize(canvas).then(() => {
            logger.debug('App', 'Scene Initialized');
            const loader = document.querySelector('#loader');
            if (loader) {
                loader.remove();
            }
        });
    }

    async initialize(canvas) {
        const logger = log.getLogger('App');
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        const config = new AppConfig();
        //const persistenceManager = new IndexdbPersistenceManager("diagram");
        const worker = new Worker(workerUrl, {type: 'module'});

        const controllers = new Controllers();
        const toolbox = new Toolbox(scene, controllers);


        const diagramManager = new DiagramManager(scene, controllers, toolbox, config);
        diagramManager.onDiagramEventObservable.add((evt) => {
            worker.postMessage({entity: evt});
        }, 2);
        config.onConfigChangedObservable.add((config) => {
            worker.postMessage({config: config});
        }, 2);
        worker.onmessage = (evt) => {
            if (evt.data.entity) {
                diagramManager.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: evt.data.entity
                }, 1);
            }
            if (evt.data.config) {
                config.onConfigChangedObservable.notifyObservers(evt.data.config, 1);
            }
        }

        worker.postMessage({type: 'init'});

        //diagramManager.setPersistenceManager(persistenceManager);

        const environment = new CustomEnvironment(scene, "default", config);
        /*persistenceManager.initialize().then(() => {
            if (!config.current?.demoCompleted) {
                const intro = new Introduction(scene, config);
                intro.start();
            }
        });
*/
        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 4,
            new Vector3(0, 1.6, 0), scene);

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
            xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
                session.addEventListener('visibilitychange', (ev) => {

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
            import('./controllers/rigplatform').then((rigmodule) => {
                const rig = new rigmodule.Rigplatform(scene, xr, diagramManager, controllers);
            });
        });

        const gamepadManager = new GamepadManager(scene);
        /*
        const voiceManager = new VoiceManager();

        voiceManager.transcriptionObserver.add((text) => {
            logger.info('Transcription', text);
            switch (text.type) {
                case TranscriptType.PartialTranscript:
                    if (text.words.length > 0 &&
                        text.words[0].text.toLowerCase() == 'meta') {
                        logger.info('Meta command', text.text);
                    }
                    break;
                case TranscriptType.FinalTranscript:
                    logger.info('Final', text.words[0].text.toLowerCase().substring(0, 4));
                    if (text.words.length > 0 &&
                        text.words[0].text.toLowerCase().substring(0, 4) == 'meta' &&
                        text.words[0].confidence > .8) {
                        logger.info('Meta Final command',
                            text.words.map((e) => {
                                return e.text
                            }).slice(1).join(' '));
                    }

            }

        });

         */
        window.addEventListener("keydown", (ev) => {
            if (ev.key == "z") {
                //voiceManager.startRecording();
            }
            if (ev.key == "x") {
                //voiceManager.stopRecording();
            }
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




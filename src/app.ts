import {
    Engine,
    FreeCamera,
    HemisphericLight,
    Scene,
    Vector3,
    WebXRDefaultExperience,
    WebXRState
} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import {Toolbox} from "./toolbox/toolbox";
import log, {Logger} from "loglevel";
import {AppConfig} from "./util/appConfig";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {Controllers} from "./controllers/controllers";
// @ts-ignore
import workerUrl from "./worker?worker&url";
import {DiagramEventType} from "./diagram/diagramEntity";
import {PeerjsNetworkConnection} from "./integration/peerjsNetworkConnection";
import {DiagramExporter} from "./util/diagramExporter";
import {Spinner} from "./util/spinner";
import {WebController} from "./controllers/webController";
import {PouchdbPersistenceManager} from "./integration/pouchdbPersistenceManager";


export class App {
    //preTasks = [havokModule];
    private logger: Logger = log.getLogger('App');

    constructor() {

        log.setDefaultLevel('warn');
        //log.getLogger('PeerjsNetworkConnection').setLevel('debug');
        log.getLogger('App').setLevel('debug');
        log.getLogger('DiagramManager').setLevel('debug');
        log.getLogger('PeerjsNetworkConnection').setLevel('debug');

        const canvas = document.querySelector('#gameCanvas');

        this.logger.debug('App', 'gameCanvas created');
        this.initialize(canvas).then(() => {
            this.logger.debug('App', 'Scene Initialized');
            const loader = document.querySelector('#loader');
            if (loader) {
                loader.remove();
            }
        });
    }

    async initialize(canvas) {

        const engine = new Engine(canvas, true);
        engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
        window.onresize = () => {
            engine.resize();
        }

        const scene = new Scene(engine);


        const spinner = new Spinner(scene);
        spinner.show();
        const config = new AppConfig();
        //const peerjsNetworkConnection = new PeerjsNetworkConnection();

        //const persistenceManager = new IndexdbPersistenceManager("diagram");
        /*const worker = new Worker(workerUrl, {type: 'module'});
        peerjsNetworkConnection.connectionObservable.add((peerId) => {
            this.logger.debug('App', 'peerjs network connected', peerId);
            worker.postMessage({type: 'sync'});
        });

         */
        const controllers = new Controllers();
        const toolbox = new Toolbox(scene, controllers);

        const diagramManager = new DiagramManager(scene, controllers, toolbox, config);
        const db = new PouchdbPersistenceManager("diagram");

        db.configObserver.add((newConfig) => {
            config.onConfigChangedObservable.notifyObservers(newConfig, 1);
        });
        config.onConfigChangedObservable.add((newConfig) => {
            db.setConfig(newConfig);
        }, 2, false, this);

        diagramManager.onDiagramEventObservable.add((evt) => {
            switch (evt.type) {
                case DiagramEventType.CHANGECOLOR:
                    db.changeColor(evt.oldColor, evt.newColor);
                    break;
                case DiagramEventType.ADD:
                    db.add(evt.entity);
                    break;
                case DiagramEventType.REMOVE:
                    db.remove(evt.entity.id);
                    break;
                case DiagramEventType.MODIFY:
                case DiagramEventType.DROP:
                    db.modify(evt.entity);
                    break;
                default:
                    this.logger.warn('App', 'unknown diagram event type', evt);
            }
        }, 2);
        db.updateObserver.add((evt) => {
            diagramManager.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: evt
            }, 1);
        });
        db.removeObserver.add((entity) => {
            diagramManager.onDiagramEventObservable.notifyObservers(
                {type: DiagramEventType.REMOVE, entity: entity}, 1);
        });

        await db.initialize();

        /*peerjsNetworkConnection.diagramEventObservable.add((evt) => {
            this.logger.debug('App', 'peerjs network event', evt);
            diagramManager.onDiagramEventObservable.notifyObservers(evt, 1);
        });
        diagramManager.onDiagramEventObservable.add((evt) => {
            this.logger.debug('App', 'diagram event', evt);
            peerjsNetworkConnection.dataReplicationObservable.notifyObservers(evt);
            worker.postMessage({entity: evt});
        }, 2);
        config.onConfigChangedObservable.add((config) => {
            this.logger.debug('App', 'config changed', config);
            worker.postMessage({config: config});
        }, 2);
        worker.onmessage = (evt) => {
            this.logger.debug(evt);

            if (evt.data.entity) {
                this.logger.debug('App', 'worker message', evt.data.entity);
                peerjsNetworkConnection.dataReplicationObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: evt.data.entity
                });
                diagramManager.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: evt.data.entity
                }, 1);
            }

            if (evt.data.config) {
                config.onConfigChangedObservable.notifyObservers(evt.data.config, 1);
                if (!evt.data.config.demoCompleted) {
                    const intro = new Introduction(scene, config);
                    //intro.start();
                }
            }
        }

        worker.postMessage({type: 'init'});
*/
        //diagramManager.setPersistenceManager(persistenceManager);

        const environment = new CustomEnvironment(scene, "default", config);
        /*persistenceManager.initialize().then(() => {
            if (!config.current?.demoCompleted) {
                const intro = new Introduction(scene, config);
                intro.start();
            }
        });
*/
        const camera: FreeCamera = new FreeCamera("Camera",
            new Vector3(0, 1.6, 3), scene);
        camera.setTarget(new Vector3(0, 1.6, 0));
//        camera.attachControl(canvas, true);

        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        new HemisphericLight("light1", new Vector3(-1, 1, 0), scene);
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

            spinner.hide();

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
            import('./controllers/rigplatform').then((rigmodule) => {
                const rig = new rigmodule.Rigplatform(scene, xr, diagramManager, controllers);

                const webController = new WebController(scene, rig, diagramManager, controllers);
                // const deckMenu = new DeckMenu(scene, xr, controllers);
                /*setTimeout(() => {
                    const soccerMenu = new SoccerMenu(scene, xr, controllers);
                }, 5000);

                 */
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
        const exportLink = document.querySelector('#downloadLink');
        if (exportLink) {
            exportLink.addEventListener('click', (ev) => {
                ev.preventDefault();
                const exporter = new DiagramExporter(scene);
                exporter.export();
            });
        }


        this.logger.info('keydown event listener added, use Ctrl+Shift+Alt+I to toggle debug layer');


        engine.runRenderLoop(() => {
            scene.render();
        });
        this.logger.info('Render loop started');
    }
}

const app = new App();




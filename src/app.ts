import {Engine, FreeCamera, Scene, Vector3} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import {Toolbox} from "./toolbox/toolbox";
import log, {Logger} from "loglevel";
import {AppConfig} from "./util/appConfig";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {Controllers} from "./controllers/controllers";
import {Spinner} from "./util/spinner";
import {PouchdbPersistenceManager} from "./integration/pouchdbPersistenceManager";
import {addSceneInspector} from "./util/functions/sceneInspctor";
import {groundMeshObserver} from "./util/functions/groundMeshObserver";

export class App {
    //preTasks = [havokModule];
    private logger: Logger = log.getLogger('App');

    constructor() {

        log.setDefaultLevel('warn');

        log.getLogger('App').setLevel('debug');
        log.getLogger('DiagramManager').setLevel('debug');

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
        const controllers = new Controllers();
        const toolbox = new Toolbox(scene, controllers);
        const diagramManager = new DiagramManager(scene, controllers, toolbox, config);

        const db = new PouchdbPersistenceManager();
        db.setDiagramManager(diagramManager);
        db.configObserver.add((newConfig) => {
            config.onConfigChangedObservable.notifyObservers(newConfig, 1);
        });
        config.onConfigChangedObservable.add((newConfig) => {
            db.setConfig(newConfig);
        }, 2, false, this);


        await db.initialize();

        const environment = new CustomEnvironment(scene, "default", config);
        const camera: FreeCamera = new FreeCamera("Camera",
            new Vector3(0, 1.6, 3), scene);
        camera.setTarget(new Vector3(0, 1.6, 0));

        environment.groundMeshObservable.add((ground) => {
            groundMeshObserver(ground, scene, diagramManager, controllers, spinner);
        }, -1, false, this);

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
        addSceneInspector(scene);

        this.logger.info('keydown event listener added, use Ctrl+Shift+Alt+I to toggle debug layer');

        engine.runRenderLoop(() => {
            scene.render();
        });
        this.logger.info('Render loop started');
    }
}

const app = new App();




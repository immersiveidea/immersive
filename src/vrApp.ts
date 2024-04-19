import {Color3, Engine, FreeCamera, Scene, Vector3, WebGPUEngine} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import log, {Logger} from "loglevel";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {Spinner} from "./objects/spinner";
import {PouchdbPersistenceManager} from "./integration/pouchdbPersistenceManager";
import {addSceneInspector} from "./util/functions/sceneInspctor";
import {groundMeshObserver} from "./util/functions/groundMeshObserver";
import {buildQuestLink} from "./util/functions/buildQuestLink";
import {exportGltf} from "./util/functions/exportGltf";
import {DefaultScene} from "./defaultScene";

const webGpu = false;
export class VrApp {

    private engine: WebGPUEngine | Engine;
    //preTasks = [havokModule];
    private logger: Logger = log.getLogger('App');

    constructor() {
        this.initializeEngine().then(() => {
            this.logger.info('Engine initialized');
        });

    }

    public async initialize() {
        const scene = DefaultScene.Scene;

        const spinner = new Spinner();
        spinner.show();

        const diagramManager = new DiagramManager();
        const db = new PouchdbPersistenceManager();
        db.setDiagramManager(diagramManager);
        await db.initialize();

        const camera: FreeCamera = new FreeCamera("Main Camera",
            new Vector3(0, 1.6, 0), scene);
        //camera.setTarget(new Vector3(0, 1.6, -3));
        scene.setActiveCameraByName("Main Camera");
        const environment = new CustomEnvironment("default", diagramManager.config);
        environment.groundMeshObservable.add((ground) => {
            groundMeshObserver(ground, diagramManager, spinner);
        }, -1, false, this);

        const gamepadManager = new GamepadManager(scene);
        /*


         */
        addSceneInspector();
        //const mainMenu = new MainMenu(scene);
        const el = document.querySelector('#download');
        if (el) {
            el.addEventListener('click', () => {
                exportGltf();
            })
        }
        this.logger.info('keydown event listener added, use Ctrl+Shift+Alt+I to toggle debug layer');
        this.engine.runRenderLoop(() => {
            scene.render();
        });
        this.logger.info('Render loop started');

    }

    private async initializeEngine() {
        const canvas = (document.querySelector('#gameCanvas') as HTMLCanvasElement);
        if (webGpu) {
            this.engine = new WebGPUEngine(canvas);
            await (this.engine as WebGPUEngine).initAsync();
        } else {
            this.engine = new Engine(canvas, true);
        }

        this.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

        window.onresize = () => {
            this.engine.resize();
        }
        const scene = new Scene(this.engine);
        scene.ambientColor = new Color3(.1, .1, .1);
        DefaultScene.Scene = scene;

        log.resetLevel();
        log.setDefaultLevel('error');
        this.logger.debug('App', 'gameCanvas created');
        await this.initialize();
    }

    public async start() {

    }
}

const vrApp = new VrApp();
buildQuestLink();







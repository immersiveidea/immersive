import {Color3, Engine, FreeCamera, Scene, Vector3} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import log, {Logger} from "loglevel";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {Spinner} from "./util/spinner";
import {PouchdbPersistenceManager} from "./integration/pouchdbPersistenceManager";
import {addSceneInspector} from "./util/functions/sceneInspctor";
import {groundMeshObserver} from "./util/functions/groundMeshObserver";
import {MainMenu} from "./menus/mainMenu";
import {buildQuestLink} from "./util/functions/buildQuestLink";
import {exportGltf} from "./util/functions/exportGltf";

export class VrApp {
    private scene: Scene;
    private engine: Engine;
    //preTasks = [havokModule];
    private logger: Logger = log.getLogger('App');

    constructor() {

        log.setDefaultLevel('warn');
        log.getLogger('App').setLevel('debug');
        log.getLogger('DiagramManager').setLevel('debug');
        const canvas = document.querySelector('#gameCanvas');
        this.logger.debug('App', 'gameCanvas created');
    }

    public async initialize(canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas, true);
        this.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
        window.onresize = () => {
            this.engine.resize();
        }
        const scene = new Scene(this.engine);
        this.scene = scene;
        this.scene.ambientColor = new Color3(.1, .1, .1);

        const spinner = new Spinner(scene);
        spinner.show();
        //const config = new AppConfig();

        const diagramManager = new DiagramManager(scene);
        const db = new PouchdbPersistenceManager();
        db.setDiagramManager(diagramManager);
        db.configObserver.add((newConfig) => {
            if (!newConfig.demoCompleted) {
                const main = document.querySelector('#main');
            } else {
                const create = document.querySelector('#create');
            }
            diagramManager.config.onConfigChangedObservable.notifyObservers(newConfig, 1);
        });
        diagramManager.config.onConfigChangedObservable.add((newConfig) => {
            db.setConfig(newConfig);
        }, 2, false, this);
        await db.initialize();

        const camera: FreeCamera = new FreeCamera("Main Camera",
            new Vector3(0, 1.6, 0), scene);
        //camera.setTarget(new Vector3(0, 1.6, -3));
        scene.setActiveCameraByName("Main Camera");
        const environment = new CustomEnvironment(scene, "default", diagramManager.config);
        environment.groundMeshObservable.add((ground) => {
            groundMeshObserver(ground, scene, diagramManager, diagramManager.controllers, spinner);
        }, -1, false, this);

        const gamepadManager = new GamepadManager(scene);
        /*


         */
        addSceneInspector(scene);
        const mainMenu = new MainMenu(scene);
        const el = document.querySelector('#download');
        if (el) {
            el.addEventListener('click', () => {
                exportGltf(scene);
            })
        }
        this.logger.info('keydown event listener added, use Ctrl+Shift+Alt+I to toggle debug layer');
        let i = 0;
        this.engine.runRenderLoop(() => {
            this.scene.render();
            if (i++ % 60 == 0) {

            }
        });
        this.logger.info('Render loop started');

    }

    public async start() {

    }
}

const vrApp = new VrApp();
const canvas = (document.querySelector('#gameCanvas') as HTMLCanvasElement);
vrApp.initialize(canvas).then(() => {
    buildQuestLink();
});






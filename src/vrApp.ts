import {Color3, Engine, FreeCamera, Observable, Scene, Vector3, WebGPUEngine} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import log, {Logger} from "loglevel";
import {CustomEnvironment} from "./util/customEnvironment";
import {Spinner} from "./objects/spinner";
import {PouchdbPersistenceManager} from "./integration/database/pouchdbPersistenceManager";
import {addSceneInspector} from "./util/functions/sceneInspector";
import {groundMeshObserver} from "./util/functions/groundMeshObserver";
import {buildQuestLink} from "./util/functions/buildQuestLink";
import {exportGltf} from "./util/functions/exportGltf";
import {DefaultScene} from "./defaultScene";
import {Introduction} from "./tutorial/introduction";

const webGpu = false;

log.setLevel('error', false);
export default class VrApp {
    //preTasks = [havokModule];
    private logger: Logger = log.getLogger('App');
    private _canvas: HTMLCanvasElement

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this.initializeEngine().then(() => {
            this.logger.info('Engine initialized');
        });
    }

    public async initialize(scene: Scene) {
        setMainCamera(scene);
        const spinner = new Spinner();
        spinner.show();
        const diagramReadyObservable = new Observable<boolean>();
        const diagramManager = new DiagramManager(diagramReadyObservable);
        diagramReadyObservable.add((ready) => {
            if (ready) {
                initDb(diagramManager);
            } else {
                this.logger.error('DiagramManager not ready');
            }
        });
        initEnvironment(diagramManager, spinner);
        addSceneInspector();
        const el = document.querySelector('#download');
        if (el) {
            el.addEventListener('click', () => {
                exportGltf();
            })
        } else {
            this.logger.error('Download button not found');
        }
        if (!localStorage.getItem('tutorialCompleted')) {
            this.logger.info('Starting tutorial');
            const intro = new Introduction();
        }
        this.logger.info('Render loop started');
    }

    private async initializeEngine() {
        if (!this._canvas) {
            console.error('Canvas not found');
            return;
        }
        let engine: WebGPUEngine | Engine = null;
        if (webGpu) {
            engine = new WebGPUEngine(this._canvas);
            await (engine as WebGPUEngine).initAsync();
        } else {
            engine = new Engine(this._canvas, true);
        }
        engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
        const scene = new Scene(engine);
        DefaultScene.Scene = scene;
        scene.ambientColor = new Color3(.1, .1, .1);
        await this.initialize(scene);
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
buildQuestLink();
function setMainCamera(scene: Scene) {
    const CAMERA_NAME = 'Main Camera';
    const camera: FreeCamera = new FreeCamera(CAMERA_NAME,
        new Vector3(0, 1.6, 0), scene);
    scene.setActiveCameraByName(CAMERA_NAME);
}

async function initDb(diagramManager: DiagramManager) {
    const db = new PouchdbPersistenceManager();
    db.setDiagramManager(diagramManager);
    await db.initialize();
}

function initEnvironment(diagramManager: DiagramManager, spinner: Spinner) {
    const environment = new CustomEnvironment("default", diagramManager.config);
    environment.groundMeshObservable.add((ground) => {
        groundMeshObserver(ground, diagramManager, spinner).then(() => {

        });
    }, -1, false, this);
}
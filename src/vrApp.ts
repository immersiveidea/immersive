import {
    Color3,
    DeviceOrientationCamera,
    Engine,
    FreeCamera,
    Observable,
    Scene,
    Vector3,
    WebGPUEngine
} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import log, {Logger} from "loglevel";
import {CustomEnvironment} from "./util/customEnvironment";
import {Spinner} from "./objects/spinner";
import {addSceneInspector} from "./util/functions/sceneInspector";
import {groundMeshObserver} from "./util/functions/groundMeshObserver";
import {exportGltf} from "./util/functions/exportGltf";
import {DefaultScene} from "./defaultScene";
import {Introduction} from "./tutorial/introduction";
import {PouchData} from "./integration/database/pouchData";

const webGpu = false;

log.setLevel('error', false);
export default class VrApp {
    //preTasks = [havokModule];
    private logger: Logger = log.getLogger('App');
    private _canvas: HTMLCanvasElement;
    private _db: PouchData;
    private _dbName: string;
    private _engine: Engine | WebGPUEngine;
    private _mobileCamera: DeviceOrientationCamera;

    constructor(canvas: HTMLCanvasElement, dbname: string) {
        this._canvas = canvas;
        this._dbName = dbname;
        console.log('VrApp constructor');
        this.initializeEngine().then(() => {
            this.logger.info('Engine initialized');
        });
    }

    public async initialize(scene: Scene) {
        this.setMainCamera(scene);
        const spinner = new Spinner();
        spinner.show();
        const diagramReadyObservable = new Observable<boolean>();
        const diagramManager = new DiagramManager(diagramReadyObservable);
        diagramReadyObservable.add((ready) => {
            if (ready) {
                const db = new PouchData(this._dbName);
                db.setDiagramManager(diagramManager);
                this._db = db;
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

    public dispose() {
        this._engine.dispose();
        DefaultScene.Scene.dispose();
        DefaultScene.Scene = null;
    }
    private async initializeEngine() {
        if (!this._canvas) {
            console.error('Canvas not found');
            return;
        }
        this._engine = null;
        if (webGpu) {
            this._engine = new WebGPUEngine(this._canvas);
            await (this._engine as WebGPUEngine).initAsync();
        } else {
            this._engine = new Engine(this._canvas, true);
        }
        this._engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
        const scene = new Scene(this._engine);
        DefaultScene.Scene = scene;
        scene.ambientColor = new Color3(.1, .1, .1);
        await this.initialize(scene);
        this._engine.runRenderLoop(() => {
            scene.render();
        });
    }

    private setMainCamera(scene: Scene) {
        const CAMERA_NAME = 'Main Camera';
        const camera: FreeCamera = new FreeCamera(CAMERA_NAME,
            new Vector3(0, 1.6, 0), scene);
        scene.setActiveCameraByName(CAMERA_NAME);

        /* if (!this._mobileCamera) {
             window.addEventListener("devicemotion", (event) => {
                 if(event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) {
                     console.log(this);
                     const camera: DeviceOrientationCamera = new DeviceOrientationCamera('Mobile Camera',
                         new Vector3(0, 1.6, 0), scene);
                     this._mobileCamera = camera;

                     scene.setActiveCameraByName('Mobile Camera');
                 }

             });
         }

         */


    }

}



function initEnvironment(diagramManager: DiagramManager, spinner: Spinner) {
    const environment = new CustomEnvironment("default", diagramManager.config);
    environment.groundMeshObservable.add((ground) => {
        groundMeshObserver(ground, diagramManager, spinner).then(() => {

        });
    }, -1, false, this);
}
import {Color3, Engine, FreeCamera, Scene, Vector3, WebGPUEngine} from "@babylonjs/core";
import '@babylonjs/loaders';
import {DiagramManager} from "./diagram/diagramManager";
import log, {Logger} from "loglevel";
import {GamepadManager} from "./controllers/gamepadManager";
import {CustomEnvironment} from "./util/customEnvironment";
import {Spinner} from "./objects/spinner";
import {PouchdbPersistenceManager} from "./integration/pouchdbPersistenceManager";
import {addSceneInspector} from "./util/functions/sceneInspector";
import {groundMeshObserver} from "./util/functions/groundMeshObserver";
import {buildQuestLink} from "./util/functions/buildQuestLink";
import {exportGltf} from "./util/functions/exportGltf";
import {DefaultScene} from "./defaultScene";
import {Introduction} from "./tutorial/introduction";

const webGpu = false;

log.setLevel('error', false);
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
        const camera: FreeCamera = new FreeCamera("Main Camera",
            new Vector3(0, 1.6, 0), scene);
        scene.setActiveCameraByName("Main Camera");
        const spinner = new Spinner();
        spinner.show();
        const diagramManager = new DiagramManager();
        const db = new PouchdbPersistenceManager();
        db.setDiagramManager(diagramManager);
        await db.initialize();
        const environment = new CustomEnvironment("default", diagramManager.config);
        environment.groundMeshObservable.add((ground) => {
            groundMeshObserver(ground, diagramManager, spinner);
        }, -1, false, this);

        const gamepadManager = new GamepadManager(scene);
        addSceneInspector();

        /*
        SceneLoader.ImportMesh(null,'https://models.deepdiagram.com/', 'Chair_textured_mesh_lowpoly_glb.glb', scene, (meshes) => {
            const transform = new Mesh('chair', scene);
            for(const mesh of meshes){
                mesh.parent= transform;
            }
            let {min, max} = transform.getHierarchyBoundingVectors(true);
            const parentMesh = MeshBuilder.CreateBox('boundingBox', {width: max.x - min.x, height: max.y - min.y, depth: max.z - min.z}, scene);
            for(const mesh of meshes){
                mesh.parent= parentMesh;

            }
            transform.dispose();
            //parentMesh.setBoundingInfo(new BoundingInfo(min, max));
            parentMesh.showBoundingBox = true;
            parentMesh.scaling = new Vector3(.2,.2,.2);
            //mesh.metadata = {grabbable: true};
            parentMesh.position.y = .5;
            parentMesh.position.z = 0;
            parentMesh.metadata = {grabbable: true};
            const material = new StandardMaterial('chairMaterial', scene);
            material.alpha = 0;
            parentMesh.material = material;
            parentMesh.showBoundingBox = true;
        });

         */
        /*
        const chair = new GaussianSplattingMesh('chair', null, scene);
        const m = await chair.loadFileAsync('https://models.deepdiagram.com/drill1.ply');

        chair.position.y = 1.6;
        chair.rotation.y = Math.PI;
        chair.scaling = chair.scaling.scale(3);
        chair.showBoundingBox = true;

         */
        const el = document.querySelector('#download');
        if (el) {
            el.addEventListener('click', () => {
                exportGltf();
            })
        }
        if (!localStorage.getItem('tutorialCompleted')) {
            this.logger.info('Starting tutorial');
            const intro = new Introduction();
        }
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
        //log.resetLevel();
        //log.setDefaultLevel('error');
        this.logger.debug('App', 'gameCanvas created');
        await this.initialize();
    }
}
const vrApp = new VrApp();
buildQuestLink();







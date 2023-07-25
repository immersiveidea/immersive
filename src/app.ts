import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import {
    ArcRotateCamera,
    Engine,
    HavokPlugin,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhotoDome,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Texture,
    Vector3,
    WebXRDefaultExperience,
    WebXRState
} from "@babylonjs/core";
///import {havokModule} from "./util/havok";
import HavokPhysics from "@babylonjs/havok";
import {Rigplatform} from "./controllers/rigplatform";
import {DiagramManager} from "./diagram/diagramManager";
import {Toolbox} from "./toolbox/toolbox";



export class App {
    //preTasks = [havokModule];

    public static scene: Scene;
    public static xr: WebXRDefaultExperience;
    public static rig: Rigplatform;
    constructor() {
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        this.initialize(canvas).then(()=>{
            console.log('Scene Initialized');
        });
    }

    async initialize(canvas) {
        if (App.xr) {
            App.xr.dispose();
            App.xr=null;
        }
        if (App.scene) {
            App.scene.dispose();
            App.scene = null;
        }
        if (DiagramManager.onDiagramEventObservable) {
            DiagramManager.onDiagramEventObservable.clear();
            DiagramManager.onDiagramEventObservable = null;
        }
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);

        App.scene = scene;



        const havokInstance = await HavokPhysics();

        const havokPlugin = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2,
            new Vector3(0, 1.6, 0), scene);
        camera.radius = 0;
        camera.attachControl(canvas, true);


        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        const photoDome = new PhotoDome('sky',
            './outdoor_field.jpeg', {},
            scene);
        const ground = this.createGround();
        App.xr = await WebXRDefaultExperience.CreateAsync(scene, {
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
        App.xr.baseExperience.onStateChangedObservable.add((state) => {
            if (state == WebXRState.IN_XR)  {
                App.xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            }
        });



        const diagramManager = new DiagramManager(App.scene, App.xr.baseExperience);
        App.rig = new Rigplatform(App.scene, App.xr);
        const toolbox = new Toolbox(scene, App.xr.baseExperience);

        //camera.parent = App.rig.rigMesh;
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        engine.runRenderLoop(() => {
            scene.render();

        });
    }

    createGround() {
        const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", App.scene);
        const gText = new Texture("./grass1.jpeg", App.scene);
        gText.uScale = 40;
        gText.vScale = 40;
        groundMaterial.baseTexture = gText;
        groundMaterial.metallic = 0;
        groundMaterial.roughness = 1;

        const ground = MeshBuilder.CreateGround("ground", {width: 100, height: 100, subdivisions: 1}, App.scene);

        ground.material = groundMaterial;
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, App.scene);
        return ground;
    }
}

const app = new App();



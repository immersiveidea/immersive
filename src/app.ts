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
    WebXRDefaultExperience
} from "@babylonjs/core";
///import {havokModule} from "./util/havok";
import HavokPhysics from "@babylonjs/havok";
import {Rigplatform} from "./controllers/rigplatform";

import {DiagramManager} from "./diagram/diagramManager";


class App {
    //preTasks = [havokModule];

    private token: string;

    constructor() {
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        this.initialize(canvas);
    }

    async initialize(canvas) {

        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        const diagramManager = new DiagramManager(scene);
        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2,
            new Vector3(0, 1.6, 0), scene);
        camera.attachControl(canvas, true);
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);


        //const envTexture = new CubeTexture("/assets/textures/SpecularHDR.dds", scene);
        //scene.createDefaultSkybox(envTexture, true, 1000);

        const photoDome = new PhotoDome('sky',
            './outdoor_field.jpeg', {},
            scene);

        const xr = await WebXRDefaultExperience.CreateAsync(scene, {
            floorMeshes: [this.createGround(scene)],
            optionalFeatures: true
        });
        const rig = new Rigplatform(scene, xr);
        //const ring = new Cameras(scene, this.token);
        //ring.getCameras().then(() => ring.createCameras());
        xr.teleportation.detach();

        // hide/show the Inspector
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

    createGround(scene) {
        const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
        const gText = new Texture("./grass1.jpeg", scene);
        gText.uScale = 40;
        gText.vScale = 40;
        groundMaterial.baseTexture = gText;
        groundMaterial.metallic = 0;
        groundMaterial.roughness = 1;

        const ground = MeshBuilder.CreateGround("ground", {width: 100, height: 100, subdivisions: 1}, scene);

        ground.material = groundMaterial;
        const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);
        return ground;
    }
}

const app = new App();


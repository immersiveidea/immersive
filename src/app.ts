import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import {
    ArcRotateCamera,
    Engine,
    HavokPlugin,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Texture,
    Vector3,
    WebXRDefaultExperience
} from "@babylonjs/core";
import {Right} from "./controllers/right";
import {Left} from "./controllers/left";
///import {havokModule} from "./util/havok";
import {Bmenu} from "./menus/bmenu";
import HavokPhysics from "@babylonjs/havok";
import {Rigplatform} from "./controllers/rigplatform";
import {Cameras} from "./integration/ring/cameras";
import {Mapt} from "./util/mapt";


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
        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2,
            new Vector3(0, 1.6, 0), scene);
        camera.attachControl(canvas, true);
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        const rig = new Rigplatform(scene);
        //const envTexture = new CubeTexture("/assets/textures/SpecularHDR.dds", scene);
        //scene.createDefaultSkybox(envTexture, true, 1000);

        /*const photoDome = new PhotoDome('sky',
            './outdoor_field.jpeg', {},
            scene);
*/
        const xr = await WebXRDefaultExperience.CreateAsync(scene, {
            floorMeshes: [this.createGround(scene)],
            optionalFeatures: true
        });
        xr.baseExperience.camera.parent = rig.rigMesh;
        const b = new Bmenu(scene, rig, xr.baseExperience);
        //const box = MeshBuilder.CreateBox("box", {size: 1}, scene);
        //box.position.z = -4;


        /*box.actionManager.registerAction(
            new InterpolateValueAction(
                ActionManager.OnPointerOverTrigger,box, 'visibility', 0.2, 500
            )
        );
        box.actionManager.registerAction(
            new InterpolateValueAction(
                ActionManager.OnPointerOutTrigger,box, 'visibility', 1, 200
            )
        );*/

        //const edit = new ObjectEditor(scene, box);
        //const edit = new ObjectEditor(scene, box);
        const ring = new Cameras(scene, this.token);
        ring.getCameras().then(() => ring.createCameras());

        const stickVector = Vector3.Zero();
        xr.input.onControllerAddedObservable.add((source, state) => {
            let controller;
            switch (source.inputSource.handedness) {
                case "right":
                    controller = new Right(source);
                    rig.right = controller;
                    controller.setBMenu(b);
                    break;
                case "left":
                    controller = new Left(source);
                    rig.left = controller;
                    break;

            }
            xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            if (controller) {
                controller.setStickVector(stickVector);
                controller.setCamera(xr.baseExperience.camera);
                controller.setRig(rig.body);
            }

            console.log(source);
            console.log(state);
        });
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
        const map = new Mapt(scene);
        map.buildMapImage();
        //map.createMapTiles(26.443397,-82.111512);


        // run the main render loop
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


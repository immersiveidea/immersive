import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import {
    ArcRotateCamera, Color3,
    Engine,
    HavokPlugin,
    HemisphericLight,
    Mesh,
    MeshBuilder, PBRMaterial, PBRMetallicRoughnessMaterial,
    PhotoDome,
    PhysicsAggregate,
    PhysicsShapeType, Quaternion,
    Scene, StandardMaterial, Texture,
    Vector3,
    WebXRDefaultExperience
} from "@babylonjs/core";
import {Right} from "./controllers/right";
import {Left} from "./controllers/left";
import {havokModule} from "./util/havok";


class App {
    preTasks = [havokModule];

    constructor() {
        this.initialize();
    }

    async initialize() {
        // create the canvas html element and attach it to the webpage
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        const hk = new HavokPlugin(true, await havokModule);
        scene.enablePhysics(new Vector3(0 , -9.8, 0), hk);

        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2,
            new Vector3(0, 1.6, 0), scene);
        camera.attachControl(canvas, true);
        const light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        const sphere: Mesh = MeshBuilder.CreateCylinder("sphere", {diameter: 1}, scene);
        sphere.setAbsolutePosition(new Vector3(0, 2, -5));

        const cylinder: Mesh = MeshBuilder.CreateCylinder("platform", {diameter: 1.5, height: .01}, scene);
        const myMaterial = new StandardMaterial("myMaterial", scene);
        myMaterial.diffuseColor = Color3.Blue();
        cylinder.material = myMaterial;
        cylinder.setAbsolutePosition(new Vector3(0, .1, -3));
        const sphereAggregate =
            new PhysicsAggregate(
                cylinder,
                PhysicsShapeType.CYLINDER,
                { friction: 1, center: Vector3.Zero(), radius: .5, mass: .1, restitution: .1},
                scene);

        sphereAggregate.body.setGravityFactor(0);

        //sphereAggregate.body.applyForce(new Vector3(0, 0,-1), cylinder.position);
        const photoDome = new PhotoDome('sky',
            './outdoor_field.jpeg', {},
            scene);
        const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
        const gText = new Texture("./grass1.jpeg", scene);
        gText.uScale =40;
        gText.vScale=40;

        scene.registerBeforeRender(() => {
            const q = cylinder.rotationQuaternion;
            const e = q.toEulerAngles();
            q.copyFrom(Quaternion.FromEulerAngles(0, e.y, 0));
        });

        groundMaterial.baseTexture = gText;
        groundMaterial.metallic =0;
        groundMaterial.roughness=1;
        const ground = MeshBuilder.CreateGround("ground", {width: 100, height: 100, subdivisions: 1}, scene);

        ground.material = groundMaterial;
        const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);

        const xr = await WebXRDefaultExperience.CreateAsync(scene, {floorMeshes: [ground],
            optionalFeatures: true});
        xr.baseExperience.camera.parent = cylinder;

        const stickVector = Vector3.Zero();

        xr.input.onControllerAddedObservable.add((source, state) => {
            let controller;
            switch (source.inputSource.handedness) {
                case "right":
                    controller = new Right(source);
                    break;
                case "left":
                    controller = new Left(source);
                    break;

            }
            xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
            if (controller) {
                controller.setStickVector(stickVector);
                controller.setCamera(xr.baseExperience.camera);
                controller.setRig(sphereAggregate.body);
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

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}

new App();
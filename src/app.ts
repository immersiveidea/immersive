import {
    ArcRotateCamera,
    DualShockPad,
    Engine,
    GroundMesh,
    HavokPlugin,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Texture,
    Vector3,
    WebXRDefaultExperience,
    WebXRState
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import {Rigplatform} from "./controllers/rigplatform";
import {DiagramManager} from "./diagram/diagramManager";
import {Toolbox} from "./toolbox/toolbox";
import {DualshockEventMapper} from "./util/dualshockEventMapper";
import log from "loglevel";
import {AppConfig} from "./util/appConfig";
import {DiaSounds} from "./util/diaSounds";

export class App {
    //preTasks = [havokModule];
    private logger = log.getLogger('App');


    private scene: Scene;

    private rig: Rigplatform;

    constructor() {
        const config = AppConfig.config;
        log.setLevel('info');
        log.getLogger('App').setLevel('debug');
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        log.debug('App', 'gameCanvas created');
        this.initialize(canvas).then(() => {
            log.debug('App', 'Scene Initialized');
        });


    }

    async initialize(canvas) {
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);

        this.scene = scene;
        const sounds = new DiaSounds(scene);
        sounds.enter.autoplay = true;


        const havokInstance = await HavokPhysics();

        const havokPlugin = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
        scene.collisionsEnabled = true;

        const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2,
            new Vector3(0, 1.6, 0), scene);
        camera.radius = 0;
        camera.attachControl(canvas, true);

        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        import('@babylonjs/core').then((babylon) => {
            new babylon.PhotoDome('sky',
                './outdoor_field2.jpeg', {},
                scene);
        });

        const ground = this.createGround();
        const xr = await WebXRDefaultExperience.CreateAsync(scene, {
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

        xr.baseExperience.onStateChangedObservable.add((state) => {
            if (state == WebXRState.IN_XR) {
                this.scene.audioEnabled = true;
                xr.baseExperience.camera.position = new Vector3(0, 1.6, 0);
                window.addEventListener(('pa-button-state-change'), (event: any) => {
                    if (event.detail) {
                        log.debug('App', event.detail);
                    }
                });

            }
        });
        const diagramManager = new DiagramManager(this.scene, xr.baseExperience);
        this.rig = new Rigplatform(this.scene, xr, diagramManager);
        const toolbox = new Toolbox(scene, xr.baseExperience, diagramManager);

        import ('./diagram/indexdbPersistenceManager').then((module) => {
            const persistenceManager = new module.IndexdbPersistenceManager("diagram");
            diagramManager.setPersistenceManager(persistenceManager);
            AppConfig.config.setPersistenceManager(persistenceManager);
            persistenceManager.initialize();
        });


        this.scene.gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
            try {
                const dualshock = (gamepad as DualShockPad);
                dualshock.onButtonDownObservable.add((button: any) => {
                    const buttonEvent = DualshockEventMapper.mapButtonEvent(button, 1);
                    if (buttonEvent.objectName) {
                        window.dispatchEvent(new CustomEvent('pa-button-state-change', {
                            detail: buttonEvent
                            }
                        ));
                    }
                });
                dualshock.onButtonUpObservable.add((button: any) => {
                    const buttonEvent = DualshockEventMapper.mapButtonEvent(button, 0);
                    if (buttonEvent.objectName) {
                        window.dispatchEvent(new CustomEvent('pa-button-state-change', {
                                detail: buttonEvent
                            }
                        ));
                    }
                });

                gamepad.onleftstickchanged((values) => {
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "left-controller",
                                value: values.x,
                                axisIndex: 0
                            }
                        }));
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "left-controller",
                                value: values.y,
                                axisIndex: 1
                            }
                        }));
                });
                gamepad.onrightstickchanged((values) => {
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "right-controller",
                                value: values.x,
                                axisIndex: 0
                            }
                        }));
                    window.dispatchEvent(
                        new CustomEvent('pa-analog-value-change', {
                            detail: {
                                objectName: "right-controller",
                                value: values.y,
                                axisIndex: 1
                            }
                        }));
                });
            } catch (err) {
                log.warn('App', err);
            }
        });


        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                import("@babylonjs/core/Debug/debugLayer").then(() => {
                    import("@babylonjs/inspector").then(() => {
                        if (scene.debugLayer.isVisible()) {
                            scene.debugLayer.hide();
                        } else {
                            scene.debugLayer.show();
                        }
                    });
                });
            }
        });
        this.logger.info('keydown event listener added, use Ctrl+Shift+Alt+I to toggle debug layer');

        engine.runRenderLoop(() => {
            scene.render();

        });
        this.logger.info('Render loop started');
    }

    createGround() {
        const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", this.scene);
        const gText = new Texture("./grass1.jpeg", this.scene);
        gText.uScale = 40;
        gText.vScale = 40;
        groundMaterial.baseTexture = gText;
        groundMaterial.metallic = 0;
        groundMaterial.roughness = 1;

        const ground: GroundMesh = MeshBuilder.CreateGround("ground", {
            width: 100,
            height: 100,
            subdivisions: 1
        }, this.scene);

        ground.material = groundMaterial;
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, this.scene);
        return ground;
    }
}
const app = new App();




import {AbstractMesh, Color3, InstancedMesh, Node, Observable, Scene, TransformNode, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {buildColor} from "./functions/buildColor";
import log from "loglevel";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";
import {Button} from "../objects/Button";
import {LightmapGenerator} from "../util/lightmapGenerator";
import {RenderingMode, RenderingModeLabels} from "../util/renderingMode";

const colors: string[] = [
    "#222222", "#8b4513", "#006400", "#778899",
    "#4b0082", "#ff0000", "#ffa500", "#ffff00",
    "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
    "#1e90ff", "#98fb98", "#ffe4b5", "#ff69b4"
]


export class Toolbox {
    public readonly _toolboxBaseNode: TransformNode;
    private readonly _tools: Map<string, InstancedMesh> = new Map<string, InstancedMesh>();
    private readonly _logger = log.getLogger('Toolbox');
    private readonly _handle: Handle;
    private readonly _scene: Scene;
    private _xr?: WebXRDefaultExperience;
    private _renderModeDisplay?: Button;

    constructor(readyObservable: Observable<boolean>) {
        this._scene = DefaultScene.Scene;
        this._toolboxBaseNode = new TransformNode("toolbox", this._scene);
        this._handle = new Handle(this._toolboxBaseNode, 'Toolbox');
        this._toolboxBaseNode.position.y = .2;
        this._toolboxBaseNode.scaling = new Vector3(0.6, 0.6, 0.6);

        // Preload lightmaps for all toolbox colors for better first-render performance
        LightmapGenerator.preloadLightmaps(colors, this._scene);

        this.buildToolbox().then(() => {
            readyObservable.notifyObservers(true);
            this._logger.info('Toolbox built');
        });
        Toolbox._instance = this;
    }

    public setXR(xr: WebXRDefaultExperience): void {
        this._xr = xr;
        this.setupXRButton();
    }
    private index = 0;
    private colorPicker: TransformNode;
    private changing = false;

    public static _instance: Toolbox;

    public static get instance() {
        return Toolbox._instance;
    }

    public get handleMesh(): TransformNode {
        return this._handle.transformNode;
    }

    public isTool(mesh: AbstractMesh) {
        return this._tools.has(mesh.id);
    }

    private async buildToolbox() {
        this.setupPointerObservable();
        await this.buildColorPicker();
        if (this._toolboxBaseNode.parent) {
            const platform = this._scene.getMeshById("platform");
            if (platform) {
                this.assignHandleParentAndStore(platform);
            } else {
                const observer = this._scene.onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
                    if (mesh && mesh.id == "platform") {
                        this.assignHandleParentAndStore(mesh);
                        this._scene.onNewMeshAddedObservable.remove(observer);
                    }
                }, -1, false, this, false);
            }
        }
    }

    private setupPointerObservable() {
        this._scene.onPointerObservable.add((pointerInfo) => {
            const pickedMesh = pointerInfo?.pickInfo?.pickedMesh;
            if (pointerInfo.type == 1 &&
                pickedMesh?.metadata?.tool == 'color') {
                if (this.changing) {
                    this._logger.debug('changing');
                    this.colorPicker.setEnabled(true);
                    return;
                } else {
                    const active = pickedMesh?.parent.getChildren(this.nodePredicate, true);
                    for (const node of active) {
                        node.setEnabled(false);
                    }
                    const nodes = pickedMesh?.metadata?.tools;
                    if (nodes) {
                        for (const node of nodes) {
                            this._scene.getNodeById(node)?.setEnabled(true);
                        }
                    }
                }
            }
        });
    }

    private nodePredicate = (node: Node) => {
        return node.getClassName() == "InstancedMesh" &&
            node.isEnabled(false) == true
    };

    private async buildColorPicker() {
        let initial = true;
        const colorArray: Promise<Node>[] = [];
        for (const c of colors) {
            colorArray.push(buildColor(Color3.FromHexString(c), this._scene, this._toolboxBaseNode, this.index++, this._tools));
            /*if (initial) {
                initial = false;
                for (const id of cnode.metadata.tools) {
                    this._scene.getNodeById(id)?.setEnabled(true);
                }

            }*/
        }
        const out = await Promise.all(colorArray);
        for (const id of out[0].metadata.tools) {
            this._scene.getNodeById(id)?.setEnabled(true);
        }
    }

    private assignHandleParentAndStore(mesh: TransformNode) {
        const offset = new Vector3(-.50, 1.6, .38);
        const rotation = new Vector3(.5, -.6, .18);

        const handle = this._handle;
        handle.transformNode.parent = mesh;
        if (!handle.idStored) {
            handle.transformNode.position = offset;
            handle.transformNode.rotation = rotation;
        }

    }

    private setupXRButton() {
        if (!this._xr) {
            this._logger.warn('XR not available, exit XR button will not be created');
            return;
        }

        this._xr.baseExperience.onStateChangedObservable.add((state) => {
            if (state == 2) {  // WebXRState.IN_XR
                // Create exit XR button
                const exitButton = Button.CreateButton("exitXr", "exitXr", this._scene, {});

                // Position button at bottom-right of toolbox, matching handle size and orientation
                exitButton.transform.position.x = 0.5;   // Right side
                exitButton.transform.position.y = -0.35; // Below color grid
                exitButton.transform.position.z = 0;     // Coplanar with toolbox
                exitButton.transform.rotation.y = Math.PI; // Flip 180° on local x-axis to face correctly
                exitButton.transform.scaling = new Vector3(.2, .2, .2); // Match handle height
                exitButton.transform.parent = this._toolboxBaseNode;

                exitButton.onPointerObservable.add((evt) => {
                    this._logger.debug(evt);
                    if (evt.sourceEvent.type == 'pointerdown') {
                        this._xr.baseExperience.exitXRAsync();
                    }
                });

                // Create rendering mode button that cycles through modes
                this.createRenderModeButton();
            }
        });
    }

    private createRenderModeButton() {
        const modes = [
            RenderingMode.LIGHTMAP_WITH_LIGHTING,
            RenderingMode.UNLIT_WITH_EMISSIVE_TEXTURE,
            RenderingMode.FLAT_EMISSIVE,
            RenderingMode.DIFFUSE_WITH_LIGHTS
        ];

        const currentMode = LightmapGenerator.getRenderingMode();

        this._renderModeDisplay = Button.CreateButton(
            `Mode: ${RenderingModeLabels[currentMode]}`,
            `renderModeButton`,
            this._scene,
            {
                width: 0.5,
                height: 0.2,
                background: Color3.FromHexString("#333333"),
                color: Color3.White(),
                fontSize: 240
            }
        );

        // Position below the color grid
        this._renderModeDisplay.transform.position.x = 0;
        this._renderModeDisplay.transform.position.y = -.2;
        this._renderModeDisplay.transform.position.z = 0;
        this._renderModeDisplay.transform.rotation.y = Math.PI;
        this._renderModeDisplay.transform.scaling = new Vector3(.4, .4, .4);
        this._renderModeDisplay.transform.parent = this._toolboxBaseNode;

        // Add click handler to cycle through modes
        this._renderModeDisplay.onPointerObservable.add((evt) => {
            if (evt.sourceEvent.type == 'pointerdown') {
                const currentMode = LightmapGenerator.getRenderingMode();
                const currentIndex = modes.indexOf(currentMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                const nextMode = modes[nextIndex];

                this._logger.info(`Cycling to rendering mode: ${nextMode}`);
                LightmapGenerator.updateAllMaterials(this._scene, nextMode);

                // Update button text
                this.updateRenderModeButton(nextMode);
            }
        });
    }

    private updateRenderModeButton(mode: RenderingMode) {
        if (this._renderModeDisplay) {
            // Dispose old button and create new one with updated text
            this._renderModeDisplay.dispose();

            this._renderModeDisplay = Button.CreateButton(
                `Mode: ${RenderingModeLabels[mode]}`,
                `renderModeButton`,
                this._scene,
                {
                    width: 0.5,
                    height: 0.2,
                    background: Color3.FromHexString("#333333"),
                    color: Color3.White(),
                    fontSize: 240
                }
            );

            this._renderModeDisplay.transform.position.x = 0;
            this._renderModeDisplay.transform.position.y = -.2;
            this._renderModeDisplay.transform.position.z = 0;
            this._renderModeDisplay.transform.rotation.y = Math.PI;
            this._renderModeDisplay.transform.scaling = new Vector3(.15, .15, .15);
            this._renderModeDisplay.transform.parent = this._toolboxBaseNode;

            // Re-attach the click handler
            this._renderModeDisplay.onPointerObservable.add((evt) => {
                if (evt.sourceEvent.type == 'pointerdown') {
                    const modes = [
                        RenderingMode.LIGHTMAP_WITH_LIGHTING,
                        RenderingMode.UNLIT_WITH_EMISSIVE_TEXTURE,
                        RenderingMode.FLAT_EMISSIVE,
                        RenderingMode.DIFFUSE_WITH_LIGHTS
                    ];

                    const currentMode = LightmapGenerator.getRenderingMode();
                    const currentIndex = modes.indexOf(currentMode);
                    const nextIndex = (currentIndex + 1) % modes.length;
                    const nextMode = modes[nextIndex];

                    this._logger.info(`Cycling to rendering mode: ${nextMode}`);
                    LightmapGenerator.updateAllMaterials(this._scene, nextMode);

                    // Update button text
                    this.updateRenderModeButton(nextMode);
                }
            });
        }
    }
}


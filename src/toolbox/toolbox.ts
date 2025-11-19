import {AbstractMesh, Color3, InstancedMesh, Node, Observable, Scene, TransformNode, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {buildColor} from "./functions/buildColor";
import log from "loglevel";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";
import {AnimatedLineTexture} from "../util/animatedLineTexture";
import {ExitXRButton} from "../objects/buttons/ExitXRButton";
import {ConfigButton} from "../objects/buttons/ConfigButton";
import {RenderModeButton} from "../objects/buttons/RenderModeButton";
import {LightmapGenerator} from "../util/lightmapGenerator";

const colors: string[] = [
    "#222222", "#8b4513", "#006400", "#778899",
    "#4b0082", "#ff0000", "#ffa500", "#ffff00",
    "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
    "#1e90ff", "#98fb98", "#ffe4b5", "#ff69b4"
]

/**
 * Get the list of available toolbox colors
 */
export function getToolboxColors(): string[] {
    return [...colors];
}


export class Toolbox {
    public readonly _toolboxBaseNode: TransformNode;
    private readonly _tools: Map<string, InstancedMesh> = new Map<string, InstancedMesh>();
    private readonly _logger = log.getLogger('Toolbox');
    private readonly _handle: Handle;
    private readonly _scene: Scene;
    private _xr?: WebXRDefaultExperience;
    private _diagramMenuManager?: any; // Import would create circular dependency

    // Button instances
    private _exitXRButton?: ExitXRButton;
    private _configButton?: ConfigButton;
    private _renderModeButton?: RenderModeButton;

    constructor(readyObservable: Observable<boolean>) {
        this._scene = DefaultScene.Scene;
        this._toolboxBaseNode = new TransformNode("toolbox", this._scene);
        this._handle = new Handle({
            contentMesh: this._toolboxBaseNode,
            label: 'Toolbox',
            defaultPosition: new Vector3(0, .4, .75),
            defaultRotation: new Vector3(.62, 0, 0)
        });
        // Position is now controlled by Handle class
        this._toolboxBaseNode.scaling = new Vector3(0.5, 0.5, 0.5);
        this._toolboxBaseNode.position.y = .2;
        // Preload lightmaps for all toolbox colors for better first-render performance
        LightmapGenerator.preloadLightmaps(colors, this._scene);

        // Preload connection textures for all toolbox colors to prevent first-connection stutter
        AnimatedLineTexture.PreloadTextures(colors);

        this.buildToolbox().then(() => {
            readyObservable.notifyObservers(true);
            this._logger.info('Toolbox built');
        });
        Toolbox._instance = this;
    }

    public setXR(xr: WebXRDefaultExperience, diagramMenuManager?: any): void {
        this._xr = xr;
        this._diagramMenuManager = diagramMenuManager;
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


    private setupXRButton() {
        if (!this._xr) {
            this._logger.warn('XR not available, exit XR button will not be created');
            return;
        }

        this._xr.baseExperience.onStateChangedObservable.add((state) => {
            if (state == 2) {  // WebXRState.IN_XR
                // Create exit XR button
                this._exitXRButton = new ExitXRButton(
                    this._xr,
                    this._scene,
                    this._toolboxBaseNode,
                    new Vector3(-0.5, -0.35, 0)  // Bottom-right
                );

                // Create config button if diagram menu manager is available
                if (this._diagramMenuManager) {
                    this._configButton = new ConfigButton(
                        () => this._diagramMenuManager.toggleVRConfigPanel(),
                        this._scene,
                        this._toolboxBaseNode,
                        new Vector3(0.5, -0.35, 0)  // Bottom-left
                    );
                }

                // Create rendering mode button
                this._renderModeButton = new RenderModeButton(
                    this._scene,
                    this._toolboxBaseNode,
                    new Vector3(0, -0.2, 0),  // Center below grid
                    new Vector3(0.4, 0.4, 0.4)
                );
            }
        });
    }

}


import {Color3, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {Button} from "../Button";
import {LightmapGenerator} from "../../util/lightmapGenerator";
import {RenderingMode, RenderingModeLabels} from "../../util/renderingMode";
import log, {Logger} from "loglevel";

/**
 * Button that cycles through rendering modes
 */
export class RenderModeButton {
    private _button: Button;
    private readonly _logger: Logger = log.getLogger('RenderModeButton');
    private readonly _scene: Scene;
    private readonly _parent: TransformNode;
    private readonly _position: Vector3;
    private readonly _scaling: Vector3;

    private readonly _modes: RenderingMode[] = [
        RenderingMode.LIGHTMAP_WITH_LIGHTING,
        RenderingMode.UNLIT_WITH_EMISSIVE_TEXTURE,
        RenderingMode.FLAT_EMISSIVE,
        RenderingMode.DIFFUSE_WITH_LIGHTS
    ];

    /**
     * Creates a Render Mode button
     * @param scene BabylonJS scene
     * @param parent Parent transform node to attach button to
     * @param position Position relative to parent (default: center below)
     * @param scaling Scaling for the button (default: 0.4, 0.4, 0.4)
     */
    constructor(
        scene: Scene,
        parent: TransformNode,
        position: Vector3 = new Vector3(0, -0.2, 0),
        scaling: Vector3 = new Vector3(0.4, 0.4, 0.4)
    ) {
        this._scene = scene;
        this._parent = parent;
        this._position = position;
        this._scaling = scaling;

        this.createButton();
        this._logger.debug('RenderModeButton created');
    }

    /**
     * Create or recreate the button with current mode label
     * @private
     */
    private createButton(): void {
        const currentMode = LightmapGenerator.getRenderingMode();

        this._button = Button.CreateButton(
            `Mode: ${RenderingModeLabels[currentMode]}`,
            'renderModeButton',
            this._scene,
            {
                width: 0.5,
                height: 0.2,
                background: Color3.FromHexString("#333333"),
                color: Color3.White(),
                fontSize: 240
            }
        );

        // Position button
        this._button.transform.position = this._position;
        this._button.transform.rotation.y = Math.PI;
        this._button.transform.scaling = this._scaling;
        this._button.transform.parent = this._parent;

        // Add click handler to cycle through modes
        this._button.onPointerObservable.add((evt) => {
            if (evt.sourceEvent.type === 'pointerdown') {
                this.cycleRenderMode();
            }
        });
    }

    /**
     * Cycle to the next rendering mode
     * @private
     */
    private cycleRenderMode(): void {
        const currentMode = LightmapGenerator.getRenderingMode();
        const currentIndex = this._modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % this._modes.length;
        const nextMode = this._modes[nextIndex];

        this._logger.info(`Cycling to rendering mode: ${nextMode}`);
        LightmapGenerator.updateAllMaterials(this._scene, nextMode);

        // Recreate button with new label
        this.updateButton(nextMode);
    }

    /**
     * Update button with new rendering mode label
     * @param mode New rendering mode
     * @private
     */
    private updateButton(mode: RenderingMode): void {
        // Dispose old button
        if (this._button) {
            this._button.dispose();
        }

        // Create new button with updated text
        this.createButton();
    }

    /**
     * Get the button transform for external positioning/manipulation
     */
    public get transform(): TransformNode {
        return this._button.transform;
    }

    /**
     * Dispose of the button and clean up resources
     */
    public dispose(): void {
        if (this._button) {
            this._button.dispose();
        }
        this._logger.debug('RenderModeButton disposed');
    }
}

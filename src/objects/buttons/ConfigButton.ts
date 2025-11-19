import {Scene, TransformNode, Vector3} from "@babylonjs/core";
import {Button} from "../Button";
import log, {Logger} from "loglevel";

/**
 * Button that toggles the VR configuration panel
 */
export class ConfigButton {
    private _button: Button;
    private readonly _logger: Logger = log.getLogger('ConfigButton');

    /**
     * Creates a Config button
     * @param toggleCallback Function to call when button is clicked
     * @param scene BabylonJS scene
     * @param parent Parent transform node to attach button to
     * @param position Position relative to parent (default: bottom-left)
     */
    constructor(
        private readonly toggleCallback: () => void,
        scene: Scene,
        parent: TransformNode,
        position: Vector3 = new Vector3(0.5, -0.35, 0)
    ) {
        this._button = Button.CreateButton("config", "config", scene, {});

        // Position button
        this._button.transform.position = position;
        this._button.transform.rotation.y = Math.PI; // Flip 180° to face correctly
        this._button.transform.scaling = new Vector3(0.2, 0.2, 0.2);
        this._button.transform.parent = parent;

        // Add click handler
        this._button.onPointerObservable.add((evt) => {
            if (evt.sourceEvent.type === 'pointerdown') {
                this._logger.debug('Config button clicked');
                this.toggleCallback();
            }
        });

        this._logger.debug('ConfigButton created');
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
        this._logger.debug('ConfigButton disposed');
    }
}

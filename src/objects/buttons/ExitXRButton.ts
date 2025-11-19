import {Scene, TransformNode, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {Button} from "../Button";
import log, {Logger} from "loglevel";

/**
 * Button that exits the XR session when clicked
 */
export class ExitXRButton {
    private _button: Button;
    private readonly _logger: Logger = log.getLogger('ExitXRButton');

    /**
     * Creates an Exit XR button
     * @param xr WebXR experience to exit from
     * @param scene BabylonJS scene
     * @param parent Parent transform node to attach button to
     * @param position Position relative to parent (default: bottom-right)
     */
    constructor(
        private readonly xr: WebXRDefaultExperience,
        scene: Scene,
        parent: TransformNode,
        position: Vector3 = new Vector3(-0.5, -0.35, 0)
    ) {
        this._button = Button.CreateButton("exitXr", "exitXr", scene, {});

        // Position button
        this._button.transform.position = position;
        this._button.transform.rotation.y = Math.PI; // Flip 180° to face correctly
        this._button.transform.scaling = new Vector3(0.2, 0.2, 0.2);
        this._button.transform.parent = parent;

        // Add click handler
        this._button.onPointerObservable.add((evt) => {
            if (evt.sourceEvent.type === 'pointerdown') {
                this._logger.debug('Exit XR button clicked');
                this.xr.baseExperience.exitXRAsync();
            }
        });

        this._logger.debug('ExitXRButton created');
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
        this._logger.debug('ExitXRButton disposed');
    }
}

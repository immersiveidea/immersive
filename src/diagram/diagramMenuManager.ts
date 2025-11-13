import {DiagramEntityType, DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import {AbstractMesh, ActionEvent, Observable, Scene, Vector3, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {InputTextView} from "../information/inputTextView";
import {DefaultScene} from "../defaultScene";
import log from "loglevel";
import {Toolbox} from "../toolbox/toolbox";
import {ClickMenu} from "../menus/clickMenu";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";
import {ConnectionPreview} from "../menus/connectionPreview";
import {ScaleMenu2} from "../menus/ScaleMenu2";
import {viewOnly} from "../util/functions/getPath";
import {GroupMenu} from "../menus/groupMenu";
import {ControllerEvent} from "../controllers/types/controllerEvent";
import {ControllerEventType} from "../controllers/types/controllerEventType";
import {ResizeGizmoManager} from "../gizmos/ResizeGizmo/ResizeGizmoManager";
import {ResizeGizmoMode} from "../gizmos/ResizeGizmo/types";
import {DiagramEntityAdapter} from "../integration/gizmo/DiagramEntityAdapter";
import {toDiagramEntity} from "./functions/toDiagramEntity";


export class DiagramMenuManager {
    public readonly toolbox: Toolbox;
    public readonly scaleMenu: ScaleMenu2;
    public readonly resizeGizmo: ResizeGizmoManager;
    private readonly _resizeGizmoAdapter: DiagramEntityAdapter;
    private readonly _notifier: Observable<DiagramEvent>;
    private readonly _inputTextView: InputTextView;
    private _groupMenu: GroupMenu;
    private readonly _scene: Scene;
    private _logger = log.getLogger('DiagramMenuManager');
    private _connectionPreview: ConnectionPreview;
    private _currentHoveredMesh: AbstractMesh | null = null;

    constructor(notifier: Observable<DiagramEvent>, controllerObservable: Observable<ControllerEvent>, readyObservable: Observable<boolean>) {
        this._scene = DefaultScene.Scene;
        this._notifier = notifier;
        this._inputTextView = new InputTextView(controllerObservable);
        //this.configMenu = new ConfigMenu(config);

        this._inputTextView.onTextObservable.add((evt) => {
            const event = {
                type: DiagramEventType.MODIFY,
                entity: {id: evt.id, text: evt.text, type: DiagramEntityType.ENTITY}
            }
            this._notifier.notifyObservers(event, DiagramEventObserverMask.FROM_DB);
        });
        this.toolbox = new Toolbox(readyObservable);


        this.scaleMenu = new ScaleMenu2(this._notifier);

        // Initialize ResizeGizmo with auto-show on hover
        this.resizeGizmo = new ResizeGizmoManager(this._scene, {
            mode: ResizeGizmoMode.ALL,
            enableSnapping: true,
            snapDistanceX: 0.1,
            snapDistanceY: 0.1,
            snapDistanceZ: 0.1,
            showNumericDisplay: true,
            showGrid: true,
            showSnapPoints: true,
            hapticFeedback: true,
            showBoundingBoxOnHoverOnly: false
        });

        // Create adapter for DiagramEntity persistence
        // Inject toDiagramEntity converter for loose coupling
        this._resizeGizmoAdapter = new DiagramEntityAdapter(
            this.resizeGizmo,
            { onDiagramEventObservable: this._notifier } as any,
            toDiagramEntity,  // Injected mesh-to-entity converter
            false             // Don't persist on drag, only on scale end
        );

        // Setup update loop for resize gizmo
        this._scene.onBeforeRenderObservable.add(() => {
            this.resizeGizmo.update();
        });

        if (viewOnly()) {
            this.toolbox.handleMesh.setEnabled(false);
            this.resizeGizmo.setEnabled(false);
            //this.scaleMenu.handleMesh.setEnabled(false)
            //  this.configMenu.handleTransformNode.setEnabled(false);
        }
        controllerObservable.add((event: ControllerEvent) => {
            if (event.type == ControllerEventType.B_BUTTON) {
                if (event.value > .8) {
                    const platform = this._scene.getMeshByName("platform");

                    if (!platform) {
                        return;
                    }
                    const cameraPos = this._scene.activeCamera.globalPosition;
                    const localCamera = Vector3.TransformCoordinates(cameraPos, platform.getWorldMatrix());
                    const toolY = this.toolbox.handleMesh.absolutePosition.y;
                    if (toolY > (cameraPos.y - .2)) {
                        this.toolbox.handleMesh.position.y = localCamera.y - .2;
                    }

                    const inputY = this._inputTextView.handleMesh.absolutePosition.y;
                    if (inputY > (cameraPos.y - .2)) {
                        this._inputTextView.handleMesh.position.y = localCamera.y - .2;
                    }
                    const configY = this._inputTextView.handleMesh.absolutePosition.y;
                    /*if (configY > (cameraPos.y - .2)) {
                        this.configMenu.handleTransformNode.position.y = localCamera.y - .2;
                    }*/
                }
            }
        });
    }

    public get connectionPreview(): ConnectionPreview {
        return this._connectionPreview;
    }

    public connect(mesh: AbstractMesh) {
        if (this._connectionPreview) {
            this._connectionPreview.connect(mesh);
            this._connectionPreview = null;
        }
    }

    public editText(mesh: AbstractMesh) {
        this._inputTextView.show(mesh);
    }

    public createClickMenu(mesh: AbstractMesh, input: WebXRInputSource): ClickMenu {
        const clickMenu = new ClickMenu(mesh);
        clickMenu.onClickMenuObservable.add((evt: ActionEvent) => {
            this._logger.debug(evt);

            switch (evt.source.id) {
                case "remove":
                    this.notifyAll({
                        type: DiagramEventType.REMOVE,
                        entity: {id: clickMenu.mesh.id, type: DiagramEntityType.ENTITY}
                    });
                    break;
                case "label":
                    this.editText(clickMenu.mesh);
                    break;
                case "connect":
                    this._connectionPreview = new ConnectionPreview(clickMenu.mesh.id, input, evt.additionalData.pickedPoint, this._notifier);
                    break;
                case "size":
                    this.scaleMenu.show(clickMenu.mesh);
                    break;
                case "group":
                    this._groupMenu = new GroupMenu(clickMenu.mesh);
                    break;
                case "close":
                    this.scaleMenu.hide();
                    break;
            }
            this._logger.debug(evt);

        }, -1, false, this, false);

        return clickMenu;
    }

    private notifyAll(event: DiagramEvent) {
        this._notifier.notifyObservers(event, DiagramEventObserverMask.ALL);
    }

    public setXR(xr: WebXRDefaultExperience): void {
        this.toolbox.setXR(xr);

        // Register controllers with resize gizmo when they're added
        xr.input.onControllerAddedObservable.add((controller) => {
            this.resizeGizmo.registerController(controller);
        });

        xr.input.onControllerRemovedObservable.add((controller) => {
            this.resizeGizmo.unregisterController(controller);
        });
    }

    /**
     * Handle pointer hovering over a diagram object
     * Auto-shows resize gizmo
     */
    public handleDiagramObjectHover(mesh: AbstractMesh | null, pointerPosition?: Vector3): void {
        // If hovering same mesh, do nothing
        if (mesh === this._currentHoveredMesh) {
            return;
        }

        // If no longer hovering any mesh, check if we should keep gizmo active
        if (!mesh) {
            if (this._currentHoveredMesh) {
                // Check if pointer is still near the gizmo or within bounding box
                const shouldKeepActive = this.shouldKeepGizmoActive(pointerPosition);

                if (!shouldKeepActive) {
                    this.resizeGizmo.detachFromMesh();
                    this._currentHoveredMesh = null;
                }
            }
            return;
        }

        // Hovering new mesh, attach gizmo
        this._currentHoveredMesh = mesh;
        this.resizeGizmo.attachToMesh(mesh);

    }

    /**
     * Check if gizmo should remain active based on pointer position
     */
    private shouldKeepGizmoActive(pointerPosition?: Vector3): boolean {
        if (!this._currentHoveredMesh) {
            return false;
        }

        // Always keep gizmo active if currently scaling
        if (this.resizeGizmo.isScaling()) {
            return true;
        }

        // Keep active if pointer is within bounding box area
        if (!pointerPosition) {
            return false;
        }

        // Get the attached mesh's bounding box
        const boundingInfo = this._currentHoveredMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;

        // Add padding to the bounding box (same as gizmo padding + handle size)
        const padding = 0.3; // Generous padding to include handles
        const min = boundingBox.minimumWorld.subtract(new Vector3(padding, padding, padding));
        const max = boundingBox.maximumWorld.add(new Vector3(padding, padding, padding));

        // Check if pointer is within the padded bounding box
        const withinBounds =
            pointerPosition.x >= min.x && pointerPosition.x <= max.x &&
            pointerPosition.y >= min.y && pointerPosition.y <= max.y &&
            pointerPosition.z >= min.z && pointerPosition.z <= max.z;

        return withinBounds;
    }

    /**
     * Register a controller with the resize gizmo
     */
    public registerControllerWithGizmo(controller: WebXRInputSource): void {
        this.resizeGizmo.registerController(controller);
    }
}
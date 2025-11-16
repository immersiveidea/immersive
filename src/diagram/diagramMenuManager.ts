import {DiagramEntityType, DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import {AbstractMesh, ActionEvent, Observable, Scene, Vector3, WebXRDefaultExperience, WebXRInputSource} from "@babylonjs/core";
import {InputTextView} from "../information/inputTextView";
import {DefaultScene} from "../defaultScene";
import log from "loglevel";
import {Toolbox} from "../toolbox/toolbox";
import {ClickMenu} from "../menus/clickMenu";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";
import {ConnectionPreview} from "../menus/connectionPreview";
import {viewOnly} from "../util/functions/getPath";
import {GroupMenu} from "../menus/groupMenu";
import {ControllerEvent} from "../controllers/types/controllerEvent";
import {ControllerEventType} from "../controllers/types/controllerEventType";
import {ResizeGizmo} from "../gizmos/ResizeGizmo";


export class DiagramMenuManager {
    public readonly toolbox: Toolbox;
    private readonly _notifier: Observable<DiagramEvent>;
    private readonly _inputTextView: InputTextView;
    private _groupMenu: GroupMenu;
    private readonly _scene: Scene;
    private _logger = log.getLogger('DiagramMenuManager');
    private _connectionPreview: ConnectionPreview;
    private _activeResizeGizmo: ResizeGizmo | null = null;
    private _xr: WebXRDefaultExperience | null = null;

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

        if (viewOnly()) {
            this.toolbox.handleMesh.setEnabled(false);
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

    public activateResizeGizmo(mesh: AbstractMesh) {
        // Dispose existing gizmo if any
        if (this._activeResizeGizmo) {
            this._activeResizeGizmo.dispose();
            this._activeResizeGizmo = null;
        }

        // XR must be available to create resize gizmo
        if (!this._xr) {
            this._logger.warn('Cannot activate resize gizmo: XR not initialized');
            return;
        }

        // Create new resize gizmo for the mesh
        this._activeResizeGizmo = new ResizeGizmo(mesh, this._xr);

        // Listen for scale end event to notify diagram manager
        this._activeResizeGizmo.onScaleEnd.add(() => {
            this.notifyAll({
                type: DiagramEventType.MODIFY,
                entity: {id: mesh.id, type: DiagramEntityType.ENTITY}
            });
        });
    }

    public disposeResizeGizmo() {
        if (this._activeResizeGizmo) {
            this._activeResizeGizmo.dispose();
            this._activeResizeGizmo = null;
        }
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
                    this.activateResizeGizmo(clickMenu.mesh);
                    break;
                case "group":
                    this._groupMenu = new GroupMenu(clickMenu.mesh);
                    break;
                case "close":
                    this.disposeResizeGizmo();
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
        this._xr = xr;
        this.toolbox.setXR(xr);
    }
}
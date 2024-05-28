import {DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import {AbstractMesh, ActionEvent, Observable, Scene, Vector3, WebXRInputSource} from "@babylonjs/core";
import {InputTextView} from "../information/inputTextView";
import {DefaultScene} from "../defaultScene";
import {ControllerEvent, ControllerEventType, Controllers} from "../controllers/controllers";
import log from "loglevel";
import {Toolbox} from "../toolbox/toolbox";
import {ScaleMenu} from "../menus/scaleMenu";
import {ClickMenu} from "../menus/clickMenu";
import {ConfigMenu} from "../menus/configMenu";
import {AppConfig} from "../util/appConfig";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";


export class DiagramMenuManager {
    public readonly toolbox: Toolbox;
    public readonly scaleMenu: ScaleMenu;
    public readonly configMenu: ConfigMenu;
    private readonly _notifier: Observable<DiagramEvent>;
    private readonly _inputTextView: InputTextView;
    private readonly _scene: Scene;
    private logger = log.getLogger('DiagramMenuManager');

    constructor(notifier: Observable<DiagramEvent>, controllers: Controllers, config: AppConfig) {
        this._scene = DefaultScene.Scene;
        this._notifier = notifier;
        this._inputTextView = new InputTextView(controllers);
        this.configMenu = new ConfigMenu(config);

        this._inputTextView.onTextObservable.add((evt) => {
            this.notifyAll({type: DiagramEventType.MODIFY, entity: {id: evt.id, text: evt.text}});
        });
        this.toolbox = new Toolbox();
        this.scaleMenu = new ScaleMenu();
        this.scaleMenu.onScaleChangeObservable.add((mesh: AbstractMesh) => {
            this.notifyAll({type: DiagramEventType.MODIFY, entity: {id: mesh.id, scale: mesh.scaling}});
            const position = mesh.absolutePosition.clone();
            position.y = mesh.getBoundingInfo().boundingBox.maximumWorld.y + .1;
            this.scaleMenu.changePosition(position);
        });
        controllers.controllerObservable.add((event: ControllerEvent) => {
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
                    if (configY > (cameraPos.y - .2)) {
                        this.configMenu.handleMesh.position.y = localCamera.y - .2;
                    }
                }
            }
        });
    }

    public editText(mesh: AbstractMesh) {
        this._inputTextView.show(mesh);
    }

    public createClickMenu(mesh: AbstractMesh, input: WebXRInputSource): ClickMenu {
        const clickMenu = new ClickMenu(mesh, input, this._notifier);
        clickMenu.onClickMenuObservable.add((evt: ActionEvent) => {
            console.log(evt);
            switch (evt.source.id) {
                case "remove":
                    this.notifyAll({type: DiagramEventType.REMOVE, entity: {id: clickMenu.mesh.id}});
                    break;
                case "label":
                    this.editText(clickMenu.mesh);
                    break;
                case "connect":
                    break;
                case "size":
                    this.scaleMenu.show(clickMenu.mesh);
                    break;
                case "close":
                    this.scaleMenu.hide();
                    break;
            }
            console.log(evt);

        }, -1, false, this, false);

        return clickMenu;
    }

    private notifyAll(event: DiagramEvent) {
        this._notifier.notifyObservers(event, DiagramEventObserverMask.ALL);
    }
}
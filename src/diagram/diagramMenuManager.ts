import {DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import {AbstractMesh, ActionEvent, Observable, Scene, TransformNode} from "@babylonjs/core";
import {DiagramEventObserverMask} from "./diagramManager";
import {InputTextView} from "../information/inputTextView";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {DefaultScene} from "../defaultScene";
import {Controllers} from "../controllers/controllers";
import log from "loglevel";
import {Toolbox} from "../toolbox/toolbox";
import {ScaleMenu} from "../menus/scaleMenu";
import {ClickMenu} from "../menus/clickMenu";

const logger = log.getLogger('DiagramMenuManager');

export class DiagramMenuManager {
    public readonly toolbox: Toolbox;
    public readonly scaleMenu: ScaleMenu;
    private readonly _notifier: Observable<DiagramEvent>;
    private readonly _inputTextView: InputTextView;
    private readonly _scene: Scene;

    constructor(notifier: Observable<DiagramEvent>, controllers: Controllers) {
        this._scene = DefaultScene.Scene;
        this._notifier = notifier;
        this._inputTextView = new InputTextView(controllers);
        this._inputTextView.onTextObservable.add((evt) => {
            const mesh = this._scene.getMeshById(evt.id);
            if (mesh) {
                const entity = toDiagramEntity(mesh);
                entity.text = evt.text;
                this.notifyAll({type: DiagramEventType.MODIFY, entity: entity});
            } else {
                logger.error("mesh not found", evt.id);
            }
        });
        this.toolbox = new Toolbox();
        this.scaleMenu = new ScaleMenu();
        this.scaleMenu.onScaleChangeObservable.add((mesh: AbstractMesh) => {
            this.notifyAll({type: DiagramEventType.MODIFY, entity: toDiagramEntity(mesh)});
            const position = mesh.absolutePosition.clone();
            position.y = mesh.getBoundingInfo().boundingBox.maximumWorld.y + .1;
            this.scaleMenu.changePosition(position);
        });
    }

    public editText(mesh: AbstractMesh) {
        this._inputTextView.show(mesh);
    }

    public createClickMenu(mesh: AbstractMesh, grip: TransformNode): ClickMenu {
        const clickMenu = new ClickMenu(mesh, grip, this._notifier);
        clickMenu.onClickMenuObservable.add((evt: ActionEvent) => {
            console.log(evt);
            switch (evt.source.id) {
                case "remove":
                    this.notifyAll({type: DiagramEventType.REMOVE, entity: toDiagramEntity(clickMenu.mesh)});
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
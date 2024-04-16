import {AbstractMesh, MeshBuilder, Observable, Scene, Vector3} from "@babylonjs/core";
import log, {Logger} from "loglevel";
import {AdvancedDynamicTexture, Control, InputText, VirtualKeyboard} from "@babylonjs/gui";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";

export type TextEvent = {
    id: string;
    text: string;
}
const logger: Logger = log.getLogger('InputTextView');
export class InputTextView {
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private readonly scene: Scene;
    private readonly inputMesh: AbstractMesh;

    private readonly controllers: Controllers;

    private readonly handle: Handle;
    private inputText: InputText;
    private diagramMesh: AbstractMesh;
    private keyboard: VirtualKeyboard;

    constructor(controllers: Controllers) {
        this.controllers = controllers;
        this.scene = DefaultScene.scene;

        this.inputMesh = MeshBuilder.CreatePlane("input", {width: 1, height: .5}, this.scene);
        this.handle = new Handle(this.inputMesh);
        this.createKeyboard();
    }

    public show(mesh: AbstractMesh) {
        this.handle.mesh.setEnabled(true);
        if (mesh.metadata?.text) {
            this.inputText.text = mesh.metadata?.text;
        } else {
            this.inputText.text = "";
        }
        this.diagramMesh = mesh;
        this.keyboard.isVisible = true;
        this.inputText.focus();
        logger.debug(mesh.metadata);
    }

    public createKeyboard() {
        const platform = this.scene.getMeshById('platform');
        const position = new Vector3(0, 1.66, .5);
        const rotation = new Vector3(.9, 0, 0);
        const handle = this.handle;
        /*if (handle.mesh.position.x != 0 && handle.mesh.position.y != 0 && handle.mesh.position.z != 0) {
            position = handle.mesh.position;
        }
        if (handle.mesh.rotation.x != 0 && handle.mesh.rotation.y != 0 && handle.mesh.rotation.z != 0) {
            rotation = handle.mesh.rotation;
        }*/
        if (!platform) {
            this.scene.onNewMeshAddedObservable.add((mesh) => {
                if (mesh.id == 'platform') {
                    logger.debug("platform added");
                    handle.mesh.parent = mesh;
                    if (!handle.idStored) {
                        handle.mesh.position = position;
                        handle.mesh.rotation = rotation;
                    }
                }
            }, -1, false, this, false);
        } else {
            handle.mesh.setParent(platform);
            if (!handle.idStored) {
                handle.mesh.position = position;
                handle.mesh.rotation = rotation;
            }
        }

        //setMenuPosition(handle.mesh, this.scene, new Vector3(0, .4, 0));
        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.inputMesh, 2048, 1024, false);

        const input = new InputText();
        input.width = 0.5;
        input.maxWidth = 0.5;
        input.height = "64px";
        input.text = "";
        input.fontSize = "32px";
        input.color = "white";
        input.background = "black";
        input.thickness = 3;
        input.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.inputText = input;
        advancedTexture.addControl(this.inputText);
        const keyboard = VirtualKeyboard.CreateDefaultLayout();
        keyboard.scaleY = 2;
        keyboard.scaleX = 2;
        keyboard.transformCenterY = 0;
        keyboard.transformCenterX = .5;
        keyboard.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        keyboard.paddingTop = "70px"
        keyboard.height = "768px";
        keyboard.fontSizeInPixels = 24;
        advancedTexture.addControl(keyboard);
        keyboard.connect(input);
        keyboard.isVisible = true;
        keyboard.isEnabled = true;
        keyboard.children.forEach((key) => {
            key.onPointerEnterObservable.add((eventData, eventState) => {
                logger.debug(eventData);
                const gripId = eventState?.userInfo?.pickInfo?.gripTransform?.id;
                if (gripId) {
                    this.controllers.controllerObserver.notifyObservers({
                        type: ControllerEventType.PULSE,
                        gripId: gripId
                    });
                }

            }, -1, false, this, false);
        });

        keyboard.onPointerDownObservable.add(() => {
            /*this.sounds.tick.play();*/
        });
        keyboard.onKeyPressObservable.add((key) => {
            if (key === '↵') {
                if (this.inputText.text && this.inputText.text.length > 0) {
                    logger.error(this.inputText.text);
                    this.onTextObservable.notifyObservers({id: this.diagramMesh.id, text: this.inputText.text});
                } else {
                    this.onTextObservable.notifyObservers({id: this.diagramMesh.id, text: null});
                }

                this.hide();
            }
        }, -1, false, this, false);
        this.keyboard = keyboard;
        this.handle.mesh.setEnabled(false);
    }

    private hide() {
        this.handle.mesh.setEnabled(false);
        this.diagramMesh = null;
    }
}
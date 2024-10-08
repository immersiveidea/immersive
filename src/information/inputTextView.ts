import {AbstractMesh, MeshBuilder, Observable, Scene, TransformNode, Vector3} from "@babylonjs/core";
import log, {Logger} from "loglevel";
import {AdvancedDynamicTexture, Control, InputText, VirtualKeyboard} from "@babylonjs/gui";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";
import {ControllerEvent} from "../controllers/types/controllerEvent";
import {ControllerEventType} from "../controllers/types/controllerEventType";

export type TextEvent = {
    id: string;
    text: string;
}

export class InputTextView {
    private logger: Logger = log.getLogger('InputTextView');
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private readonly scene: Scene;
    private readonly inputMesh: AbstractMesh;

    private readonly controllerObservable: Observable<ControllerEvent>;

    private readonly handle: Handle;
    private inputText: InputText;
    private diagramMesh: AbstractMesh;
    private keyboard: VirtualKeyboard;

    constructor(controllerObservable: Observable<ControllerEvent>) {
        this.controllerObservable = controllerObservable;
        this.scene = DefaultScene.Scene;
        this.inputMesh = MeshBuilder.CreatePlane("input", {width: 1, height: .5}, this.scene);
        this.handle = new Handle(this.inputMesh, 'Input');
        this.inputMesh.position.y = .06;
        this.inputMesh.position.z = .02;
        this.createKeyboard();
    }

    public get handleMesh(): TransformNode {
        return this.handle.transformNode;
    }

    public show(mesh: AbstractMesh) {
        this.handle.transformNode.setEnabled(true);
        if (mesh.metadata?.text) {
            this.inputText.text = mesh.metadata?.text;
        } else {
            this.inputText.text = "";
        }
        this.diagramMesh = mesh;
        this.keyboard.isVisible = true;
        this.inputText.focus();
        this.logger.debug(mesh.metadata);
    }

    public createKeyboard() {
        const platform = this.scene.getMeshById('platform');
        const position = new Vector3(0, 1.66, .53);
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
                    this.logger.debug("platform added");
                    handle.transformNode.parent = mesh;
                    if (!handle.idStored) {
                        handle.transformNode.position = position;
                        handle.transformNode.rotation = rotation;
                    }
                }
            }, -1, false, this, false);
        } else {
            handle.transformNode.setParent(platform);
            if (!handle.idStored) {
                handle.transformNode.position = position;
                handle.transformNode.rotation = rotation;
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
                this.logger.debug(eventData);
                const gripId = eventState?.userInfo?.pickInfo?.gripTransform?.id;
                if (gripId) {
                    this.controllerObservable.notifyObservers({
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
                    this.logger.error(this.inputText.text);
                    this.onTextObservable.notifyObservers({id: this.diagramMesh.id, text: this.inputText.text});
                } else {
                    this.onTextObservable.notifyObservers({id: this.diagramMesh.id, text: null});
                }

                this.hide();
            }
        }, -1, false, this, false);
        this.keyboard = keyboard;
        this.handle.transformNode.setEnabled(false);
    }

    private hide() {
        this.handle.transformNode.setEnabled(false);
        this.diagramMesh = null;
    }
}
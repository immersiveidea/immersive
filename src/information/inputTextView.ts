import {AbstractMesh, MeshBuilder, Observable, Scene, Vector3} from "@babylonjs/core";
import log, {Logger} from "loglevel";
import {AdvancedDynamicTexture, Control, InputText, VirtualKeyboard} from "@babylonjs/gui";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {Handle} from "../objects/handle";

export type TextEvent = {
    id: string;
    text: string;
}

export class InputTextView {
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private readonly scene: Scene;
    private readonly inputMesh: AbstractMesh;
    private sounds: DiaSounds;
    private readonly controllers: Controllers;
    private readonly logger: Logger = log.getLogger('InputTextView');
    private readonly handle: Handle;
    private inputText: InputText;
    private diagramMesh: AbstractMesh;

    constructor(scene: Scene, controllers: Controllers) {
        this.controllers = controllers;
        this.scene = scene;
        this.sounds = new DiaSounds(scene);
        this.inputMesh = MeshBuilder.CreatePlane("input", {width: 1, height: .5}, this.scene);
        this.handle = new Handle(this.inputMesh);
        this.createKeyboard();
    }

    public show(mesh: AbstractMesh) {
        this.inputText.text = mesh.metadata?.label || "";
        this.handle.mesh.setEnabled(true);
        this.diagramMesh = mesh;
        console.log(mesh.metadata);
    }

    public createKeyboard() {
        const platform = this.scene.getMeshById('platform');
        let position = new Vector3(0, 1.66, .5);
        let rotation = new Vector3(0, .9, 0);
        const handle = this.handle;
        if (handle.mesh.position.x != 0 && handle.mesh.position.y != 0 && handle.mesh.position.z != 0) {
            position = handle.mesh.position;
        }
        if (handle.mesh.rotation.x != 0 && handle.mesh.rotation.y != 0 && handle.mesh.rotation.z != 0) {
            rotation = handle.mesh.rotation;
        }
        if (!platform) {
            this.scene.onNewMeshAddedObservable.add((mesh) => {
                if (mesh.id == 'platform') {
                    this.logger.debug("platform added");
                    handle.mesh.setParent(platform);

                    handle.mesh.position = position;
                    handle.mesh.rotation = rotation;
                }
            });
        } else {
            handle.mesh.parent = platform;
            handle.mesh.position = position;
            handle.mesh.rotation = rotation;
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
                    this.controllers.controllerObserver.notifyObservers({
                        type: ControllerEventType.PULSE,
                        gripId: gripId
                    });
                }

            }, -1, false, this, false);
        });

        keyboard.onPointerDownObservable.add(() => {
            this.sounds.tick.play();
        });
        keyboard.onKeyPressObservable.add((key) => {
            if (key === '↵') {
                this.logger.error(this.inputText.text);
                this.onTextObservable.notifyObservers({id: this.diagramMesh.id, text: this.inputText.text});
                this.hide();
            }
        }, -1, false, this, false);
        this.handle.mesh.setEnabled(false);
    }

    private hide() {
        this.handle.mesh.setEnabled(false);
        this.diagramMesh = null;
    }
}
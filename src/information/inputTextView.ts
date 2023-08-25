import {MeshBuilder, Observable, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import log from "loglevel";
import {AdvancedDynamicTexture, Control, InputText, VirtualKeyboard} from "@babylonjs/gui";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {setMenuPosition} from "../util/functions/setMenuPosition";

export type TextEvent = {
    text: string;
}
export type InputTextViewOptions = {
    scene?: Scene;
    xr?: WebXRDefaultExperience;
    text?: string;
    controllers?: Controllers;
}

export class InputTextView {
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private readonly text: string = "";
    private readonly scene: Scene;
    private readonly controllers: Controllers;
    private readonly xr: WebXRDefaultExperience;

    constructor(text: string, xr: WebXRDefaultExperience, scene: Scene) {
        this.text = text ? text : "";
        this.xr = xr;
        this.scene = scene;
    }

    public show() {
        this.showVirtualKeyboard();
        /*if ((this.xr as WebXRDefaultExperience).baseExperience?.sessionManager?.inXRSession) {
            this.showXr();
        } else {
            this.showWeb();
        }*/
    }

    public showVirtualKeyboard() {


        const inputMesh = MeshBuilder.CreatePlane("input", {width: 1, height: .5}, this.scene);
        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(inputMesh, 2048, 1024, false);

        const input = new InputText();

        input.width = 0.5;
        input.maxWidth = 0.5;
        input.height = "64px";
        input.text = this.text;

        input.fontSize = "32px";
        input.color = "white";
        input.background = "black";
        input.thickness = 3;
        input.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        advancedTexture.addControl(input);

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


        keyboard.onKeyPressObservable.add((key) => {
            if (key === '↵') {
                this.onTextObservable.notifyObservers({text: input.text});
                input.dispose();
                keyboard.dispose();
                advancedTexture.dispose();
                inputMesh.dispose();
            }
        });
        setMenuPosition(inputMesh, this.scene, new Vector3(0, .4, 0));
    }

    public showWeb() {
        const textInput = new InputText('identity', this.text);
        textInput.width = 0.2;
        textInput.height = "40px";
        textInput.color = "white";
        textInput.background = "black";
        textInput.focusedBackground = "black";

        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("myUI");
        advancedTexture.addControl(textInput);
        textInput.onKeyboardEventProcessedObservable.add((evt) => {
            if (evt.key === 'Enter') {
                this.onTextObservable.notifyObservers({text: textInput.text});
                textInput.dispose();
                advancedTexture.dispose();

            }

        });
    }

    private showXr() {
        const textInput = document.createElement("input");
        textInput.type = "text";
        document.body.appendChild(textInput);
        textInput.value = this.text;
        this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.HIDE});

        /*if (this.xr?.baseExperience?.sessionManager?.inXRSession) {
            this.xr.input.controllers.forEach((controller) => {
                controller.motionController.rootMesh.setEnabled(false);
                controller.pointer.setEnabled(false);
            });

        }*/

        textInput.addEventListener('blur', () => {
            log.getLogger('bmenu').debug("blur");
            this.onTextObservable.notifyObservers({text: textInput.value});
            this.controllers.controllerObserver.notifyObservers({type: ControllerEventType.SHOW});

            /*if (this.xr?.baseExperience?.sessionManager?.inXRSession) {
                this.xr.input.controllers.forEach((controller) => {
                    controller.motionController.rootMesh.setEnabled(true);
                    controller.pointer.setEnabled(true);
                });
            }*/
            textInput.blur();
            textInput.remove();
        });

        textInput.focus();
    }
}
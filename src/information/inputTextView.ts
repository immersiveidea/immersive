import {Observable, Scene, WebXRDefaultExperience} from "@babylonjs/core";
import log from "loglevel";
import {AdvancedDynamicTexture, InputText} from "@babylonjs/gui";

export type TextEvent = {
    text: string;
}
export type InputTextViewOptions = {
    scene?: Scene;
    xr?: WebXRDefaultExperience;
    text?: string;
}

export class InputTextView {
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private readonly text: string;
    private readonly scene: Scene;
    private readonly xr: WebXRDefaultExperience;

    constructor(options: InputTextViewOptions) {
        if (options.text) {
            this.text = options.text;
        }
        if (options.xr) {
            this.xr = options.xr;
        }
        if (options.scene) {
            this.scene = options.scene;
        }
    }

    public show() {
        if (this?.xr?.baseExperience?.sessionManager?.inXRSession) {
            this.showXr();
        } else {
            this.showWeb();
        }
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
        if (this.xr?.baseExperience?.sessionManager?.inXRSession) {
            this.xr.input.controllers.forEach((controller) => {
                controller.motionController.rootMesh.setEnabled(false);
                controller.pointer.setEnabled(false);
            });

        }

        textInput.focus();
        if (navigator.userAgent.indexOf('Macintosh') > -1) {
            textInput.addEventListener('input', (event) => {
                log.debug(event);
            });

        } else {
            textInput.addEventListener('blur', () => {
                log.getLogger('bmenu').debug("blur");
                this.onTextObservable.notifyObservers({text: textInput.value});
                if (this.xr?.baseExperience?.sessionManager?.inXRSession) {
                    this.xr.input.controllers.forEach((controller) => {
                        controller.motionController.rootMesh.setEnabled(true);
                        controller.pointer.setEnabled(true);
                    });
                }
                textInput.blur();
                textInput.remove();
            });
        }
    }
}
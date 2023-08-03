import {Right} from "../controllers/right";
import {Left} from "../controllers/left";
import {Observable, Scene, WebXRSessionManager} from "@babylonjs/core";
import log from "loglevel";
import {AdvancedDynamicTexture, InputText} from "@babylonjs/gui";

export type TextEvent = {
    text: string;
}
export type InputTextViewOptions = {
    scene?: Scene;
    xrSession?: WebXRSessionManager;
    text?: string;
}

export class InputTextView {
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private text: string;
    private readonly scene: Scene;
    private readonly xrSession: WebXRSessionManager;

    constructor(options: InputTextViewOptions) {
        if (options.text) {
            this.text = options.text;
        }
        if (options.xrSession) {
            this.xrSession = options.xrSession;
        }
        if (options.scene) {
            this.scene = options.scene;
        }
    }

    public show() {
        if (this?.xrSession?.inXRSession) {
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

        if (this.xrSession.inXRSession) {
            Right.instance.disable();
            Left.instance.disable();
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
                Right.instance.enable();
                Left.instance.enable();
                textInput.blur();
                textInput.remove();
            });
        }
    }
}
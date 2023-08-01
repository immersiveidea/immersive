import {Right} from "../controllers/right";
import {Left} from "../controllers/left";
import {Observable, WebXRSessionManager} from "@babylonjs/core";
import log from "loglevel";

export type TextEvent = {
    text: string;
}

export class InputTextView {
    public readonly onTextObservable: Observable<TextEvent> = new Observable<TextEvent>();
    private text: string;
    private xrSession: WebXRSessionManager;

    constructor(xrSession: WebXRSessionManager, text: string) {
        this.xrSession = xrSession;
        this.text = text;
    }

    public show() {
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
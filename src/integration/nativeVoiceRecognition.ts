import {Observable} from "@babylonjs/core";

export class NativeVoiceRecognition {
    public readonly onTextObservable: Observable<string> = new Observable<string>();
    private recognition: SpeechRecognition;

    constructor() {

        this.onTextObservable = new Observable<string>();
        this.setup();
    }

    public stop() {
        this.recognition.stop();
    }

    private setup() {

        //const SpeechRecognition2 = SpeechRecognition || webkitSpeechRecognition
        // const SpeechGrammarList = SpeechGrammarList || window.webkitSpeechGrammarList
        //const SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent
        try {
            this.recognition = new webkitSpeechRecognition();
        } catch (e) {
            this.recognition = new SpeechRecognition();
        }

        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.onresult = (event) => {
            this.onTextObservable.notifyObservers(event.results[0][0].transcript);

        }
        this.recognition.onend = () => {


        }
        this.recognition.onstart = () => {

        }

        this.recognition.start();


    }
}
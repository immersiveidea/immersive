import {AppConfig} from "../util/appConfig";
import {Scene} from "@babylonjs/core";

export class Tutorial {
    private scene: Scene;
    private config: AppConfig;

    constructor(scene: Scene, config: AppConfig) {
        this.scene = scene;
        this.config = config;
        const advance = document.querySelector('#advanceLink');
        if (advance) {
            advance.addEventListener('click', () => {
                this.advance();
            });
        }

        console.log('Tutorial');
    }

    private advance() {
        window.alert('here');
    }
}
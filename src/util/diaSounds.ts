import {Scene, Sound} from "@babylonjs/core";

export class DiaSounds {
    private readonly scene: Scene;

    private readonly _birds: Sound;

    private static _instance: DiaSounds;

    public static get instance() {
        return DiaSounds._instance;
    }

    public get tick() {
        return new Sound("tick", '/assets/sounds/tick.mp3', this.scene);
    }

    constructor(scene: Scene) {
        this.scene = scene;
        this._enter = new Sound("enter", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 0,
            length: 1.0
        });
        this._exit = new Sound("exit", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 1,
            length: 1.0
        });
        this._high = new Sound("high", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 2,
            length: 1.0
        });
        this._low = new Sound("low", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 3,
            length: 1.0
        });
        this._birds = new Sound("birds", "/assets/sounds/birds.mp3", this.scene, null, {
            autoplay: true,
            loop: true
        });
        //this._enter.autoplay = true;
        DiaSounds._instance = this;
    }
    private readonly _enter: Sound;

    public get enter() {
        return this._enter;
    }

    private readonly _exit: Sound;

    public get exit() {
        return this._exit;
    }

    private readonly _high: Sound;

    public get high() {
        return this._high;
    }

    private readonly _low: Sound;

    public get low() {
        return this._low;
    }
}

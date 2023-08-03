import {Scene, Sound} from "@babylonjs/core";


export class DiaSounds {
    public static instance: DiaSounds;
    private readonly scene: Scene;

    constructor(scene: Scene) {

        this.scene = scene;
        this._enter = new Sound("enter", "./sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 0,
            length: 1.0
        });
        this._exit = new Sound("exit", "./sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 1,
            length: 1.0
        });
        this._high = new Sound("high", "./sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 2,
            length: 1.0
        });
        this._low = new Sound("low", "./sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 3,
            length: 1.0
        });


        DiaSounds.instance = this;
    }

    public get tick() {
        return new Sound("tick", './tick.mp3', this.scene);
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

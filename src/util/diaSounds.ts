import {Scene, Sound} from "@babylonjs/core";

export class DiaSounds {
    private readonly scene: Scene;

    private readonly _birds: Sound;

    public get tick() {
        return new Sound("tick", '/assets/sounds/tick.mp3', this.scene);
    }

    private volume: number = 0.8;
    private readonly _bounce: Sound;
    private readonly _background: Sound;
    private readonly _enter: Sound;

    public get enter() {
        return this._enter;
    }

    constructor(scene: Scene) {
        this.scene = scene;
        this._enter = new Sound("enter", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            volume: this.volume,
            offset: 0,
            length: 1.0
        });
        this._exit = new Sound("exit", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 1,
            volume: this.volume,
            length: 1.0
        });
        this._high = new Sound("high", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 2,
            volume: this.volume,
            length: 1.0
        });
        this._low = new Sound("low", "/assets/sounds/sounds.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 3,
            volume: this.volume,
            length: 1.0
        });


        this._bounce = new Sound("bounce", "/assets/sounds/drumsprite.mp3", this.scene, null, {
            autoplay: false,
            loop: false,
            offset: 0,
            length: 0.990
        });
        this._background = new Sound("brown", "/assets/sounds/brown.mp3", this.scene, null, {
            autoplay: false,
            volume: 1,
            loop: true
        });
        this._birds = new Sound("warbler", "/assets/sounds/warbler.mp3", this.scene, null, {
            spatialSound: true,
            autoplay: false,
            volume: .5,
            loop: false
        });
        this.birds.switchPanningModelToHRTF();
        this.birds.maxDistance = 40;
        this._dove = new Sound("dove", "/assets/sounds/dove.mp3", this.scene, null, {
            spatialSound: true,
            autoplay: false,
            volume: .5,
            loop: false
        });
        this._dove.switchPanningModelToHRTF();
        this._dove.maxDistance = 40;

        //this._enter.autoplay = true;
    }

    public get background(): Sound {
        return this._background;
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

    public get birds(): Sound {
        return this._birds;
    }

    _dove: Sound;
    public get dove() {
        return this._dove;
    }

    public get bounce() {
        const bounce = this._bounce.clone();
        bounce.updateOptions({offset: 0, volume: this.volume, length: .990});
        bounce.onEndedObservable.add(() => {
            bounce.dispose();
        });
        return bounce;
    }
}

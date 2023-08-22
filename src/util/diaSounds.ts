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
        const soundSprite = [
            {obj: "_enter", name: "enter", url: "/assets/sounds/sounds.mp3"},
            {obj: "_exit", name: "exit", url: "/assets/sounds/sounds.mp3"},
            {obj: "_high", name: "high", url: "/assets/sounds/sounds.mp3"},
            {obj: "_low", name: "low", url: "/assets/sounds/sounds.mp3"},
        ];

        soundSprite.forEach((item: { obj: any, name: string, url: string }, idx) => {
            this[item.obj] = new Sound(item.name, item.url, this.scene, null, {
                autoplay: false,
                loop: false,
                volume: this.volume,
                offset: idx,
                length: 1.0
            });
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
        const spatialOptions = {
            spatialSound: true,
            autoplay: false,
            volume: .5,
            loop: false
        }
        this._birds = this.buildSpatialSound("warbler", "/assets/sounds/warbler.mp3");
        this._dove = this.buildSpatialSound("dove", "/assets/sounds/dove.mp3");
    }

    private buildSpatialSound(name: string, url: string) {
        const spatialOptions = {
            spatialSound: true,
            autoplay: false,
            volume: .5,
            loop: false
        }
        const sound = new Sound(name, url, this.scene, null, spatialOptions);
        sound.switchPanningModelToHRTF();
        sound.maxDistance = 40;
        return sound;
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

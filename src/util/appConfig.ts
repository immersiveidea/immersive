import {Observable} from "@babylonjs/core";
import {AppConfigType, LabelRenderingMode} from "./appConfigType";

export class AppConfig {
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;
    public readonly defaultConfig: AppConfigType = {
        id: 1,
        locationSnap: .1,
        rotateSnap: 90,
        createSnap: .1,
        turnSnap: 22.5,
        newRelicKey: null,
        newRelicAccount: null,
        physicsEnabled: false,
        flyMode: true,
        labelRenderingMode: 'billboard'
    }

    constructor() {
        this._currentConfig = this.defaultConfig;
        try {
            const config = JSON.parse(localStorage.getItem('appConfig'));
            if (config) {
                this._currentConfig = config;
            } else {

                localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));
            }
        } catch (err) {
            console.error(err);
        }
        this.onConfigChangedObservable.add((config) => {
            this._currentConfig = config;
        }, -1);
    }

    public get current(): AppConfigType {
        return this._currentConfig;
    }

    public set current(config: AppConfigType) {
        this._currentConfig = config;
        localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, -1);
    }

    public setRotateSnap(value: number) {
        this._currentConfig.rotateSnap = value;
        this.save();
    }

    public setFlyMode(value: boolean) {
        this._currentConfig.flyMode = value;
        this.save();
    }


    public setTurnSnap(value: number) {
        this._currentConfig.turnSnap = value;
        this.save();
    }

    public setGridSnap(value: number) {
        this._currentConfig.locationSnap = value;
        this.save();
    }

    public setLabelRenderingMode(mode: LabelRenderingMode) {
        this._currentConfig.labelRenderingMode = mode;
        this.save();
    }

    private save() {
        localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, -1);
    }
}

// Singleton instance for app-wide configuration
// Use this instead of creating new AppConfig() instances
export const appConfigInstance = new AppConfig();
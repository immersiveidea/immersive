import {Observable} from "@babylonjs/core";
import {AppConfigType} from "./appConfigType";

export class AppConfig {
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;
    public readonly defaultConfig: AppConfigType = {
        id: 1,
        gridSnap: .1,
        rotateSnap: 90,
        createSnap: .1,
        turnSnap: 22.5,
        newRelicKey: null,
        newRelicAccount: null,
        physicsEnabled: false,
        flyMode: true
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

    public setCreateSnap(value: number) {
        this._currentConfig.createSnap = value;
        this.save();
    }

    public setTurnSnap(value: number) {
        this._currentConfig.turnSnap = value;
        this.save();
    }

    public setGridSnap(value: number) {
        this._currentConfig.gridSnap = value;
        this.save();
    }

    public setPhysicsEnabled(physicsEnabled: boolean) {
        this._currentConfig.physicsEnabled = physicsEnabled;
        this.save();
    }

    private save() {
        localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, -1);
    }
}

let defaultConfig: ConfigType =
    {
        locationSnap: '.1',
        locationSnapEnabled: true,
        rotationSnap: '90',
        rotationSnapEnabled: true,
        flyModeEnabled: true,
        snapTurnSnap: '45',
        snapTurnSnapEnabled: false
    }
try {
    const newConfig = JSON.parse(localStorage.getItem('config'));
    defaultConfig = {...defaultConfig, ...newConfig};

} catch (e) {

}

export type ConfigType = {
    locationSnap: string,
    locationSnapEnabled: boolean,
    rotationSnap: string,
    rotationSnapEnabled: boolean,
    flyModeEnabled: boolean,
    snapTurnSnap: string,
    snapTurnSnapEnabled: boolean
}

export function getAppConfig(): ConfigType {
    return defaultConfig;
}

export function setAppConfig(config: ConfigType) {
    localStorage.setItem('config', JSON.stringify(config));
}
import {Observable} from "@babylonjs/core";
import {AppConfigType} from "./appConfigType";

export class AppConfig {
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;

    constructor() {
        this.onConfigChangedObservable.add((config, state) => {
            console.log(state);
            this._currentConfig = config;
        }, -1);
    }

    public get current(): AppConfigType {
        if (!this._currentConfig) {

            this._currentConfig = {
                id: 1,
                gridSnap: .1,
                rotateSnap: 45,
                createSnap: .1,
                turnSnap: 22.5,
                newRelicKey: null,
                newRelicAccount: null,
                physicsEnabled: false,
                demoCompleted: false,
            }

        }
        return this._currentConfig;
    }

    public set current(config: AppConfigType) {
        this._currentConfig = config;
        this.onConfigChangedObservable.notifyObservers(config, 2);
    }

    public load(config: AppConfigType) {
        this._currentConfig = config;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 1);
    }
}
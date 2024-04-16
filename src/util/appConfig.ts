import {Observable} from "@babylonjs/core";
import {AppConfigType} from "./appConfigType";

export class AppConfig {
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;

    constructor() {
        this._currentConfig = {
            id: 1,
            gridSnap: .1,
            rotateSnap: 90,
            createSnap: .1,
            turnSnap: 22.5,
            newRelicKey: null,
            newRelicAccount: null,
            physicsEnabled: false,
            demoCompleted: false,
            flyMode: true
        };
        this.onConfigChangedObservable.add((config) => {
            this._currentConfig = config;
        }, -1);
    }

    public get current(): AppConfigType {
        return this._currentConfig;
    }

    public setRotateSnap(value: number) {
        this._currentConfig.rotateSnap = value;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);
    }

    public setFlyMode(value: boolean) {
        this._currentConfig.flyMode = value;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);
    }

    public setCreateSnap(value: number) {
        this._currentConfig.createSnap = value;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);
    }

    public setTurnSnap(value: number) {
        this._currentConfig.turnSnap = value;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);
    }

    public setGridSnap(value: number) {
        this._currentConfig.gridSnap = value;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);
    }

    public set current(config: AppConfigType) {
        this._currentConfig = config;
        this.onConfigChangedObservable.notifyObservers(config, 2);
    }

    public load(config: AppConfigType) {
        this._currentConfig = config;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 1);
    }

    public setPassphrase(passphrase: string) {
        this._currentConfig.passphrase = passphrase;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);

    }

    public setPhysicsEnabled(physicsEnabled: boolean) {
        this._currentConfig.physicsEnabled = physicsEnabled;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);

    }

    public setDemoCompleted(demoCompleted: boolean) {
        this._currentConfig.demoCompleted = demoCompleted;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 2);
    }
}
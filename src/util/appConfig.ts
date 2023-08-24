import {Observable} from "@babylonjs/core";

//import {IPersistenceManager} from "../integration/iPersistenceManager";
import {AppConfigType} from "./appConfigType";

export class AppConfig {
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;

    //  private persistenceManager: IPersistenceManager;

    constructor() {
        this.onConfigChangedObservable.add((config, state) => {
            console.log(state);
            this._currentConfig = config;
        }, 2);
        //this.persistenceManager = persistenceManager;
        //this.persistenceManager.configObserver.add(this.load, -1, false, this, false);
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
        this.onConfigChangedObservable.notifyObservers(config, 2);
        this.save();
    }

    public save() {
        //this.persistenceManager.setConfig(this._currentConfig);
    }

    public load(config: AppConfigType) {
        this._currentConfig = config;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, 1);
    }
}
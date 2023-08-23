import {Angle, Observable, Vector3} from "@babylonjs/core";
import log from "loglevel";
import round from "round";
import {IPersistenceManager} from "../integration/iPersistenceManager";
import {AppConfigType} from "./appConfigType";

export class AppConfig {
    private readonly logger = log.getLogger('AppConfig');
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;
    private persistenceManager: IPersistenceManager;

    constructor(persistenceManager: IPersistenceManager) {
        this.persistenceManager = persistenceManager;
        this.persistenceManager.configObserver.add(this.load, -1, false, this, false);
    }

    public get current(): AppConfigType {
        if (!this._currentConfig) {
            this.persistenceManager.getConfig().then((config) => {
                if (!config) {
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
                    this.save();
                } else {
                    this._currentConfig = config;
                }

            });
        }
        return this._currentConfig;
    }

    public set current(config: AppConfigType) {
        this._currentConfig = config;
        this.save();
    }

    public save() {
        this.persistenceManager.setConfig(this._currentConfig);
    }

    public load(config: AppConfigType) {
        this._currentConfig = config;
        this.onConfigChangedObservable.notifyObservers(this._currentConfig);
    }

    public snapGridVal(value: Vector3, snap: number): Vector3 {
        if (!snap) {
            return value;
        }
        const position = value.clone();
        position.x = round(value.x, snap);
        position.y = round(value.y, snap);
        position.z = round(value.z, snap);
        return position;
    }

    public snapRotateVal(value: Vector3, snap: number): Vector3 {
        if (!snap) {
            return value;
        }
        const rotation = new Vector3();
        rotation.x = this.snapAngle(value.x, snap);
        rotation.y = this.snapAngle(value.y, snap);
        rotation.z = this.snapAngle(value.z, snap);
        return rotation;
    }

    private snapAngle(val: number, snap: number): number {
        const angle = snap;
        const deg = Angle.FromRadians(val).degrees();
        const snappedDegrees = round(deg, angle);
        this.logger.debug("deg", val, deg, snappedDegrees, angle);
        return Angle.FromDegrees(snappedDegrees).radians();
    }
}
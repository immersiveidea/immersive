import {Angle, Vector3} from "@babylonjs/core";
import log from "loglevel";
import round from "round";
import {IPersistenceManager} from "../integration/iPersistenceManager";
import {AppConfigType} from "./appConfigType";

export type SnapValue = {
    value: number,
    label: string
}


export class AppConfig {
    private readonly logger = log.getLogger('AppConfig');
    private gridSnap = 1;
    private _turnSnap = 0;
    private rotateSnap = 0;
    private createSnap = 0;
    _physicsEnabled = false;
    private readonly defaultGridSnapIndex = 1;
    private persistenceManager: IPersistenceManager = null;
    private gridSnapArray: SnapValue[] =
        [{value: 0, label: "Off"},
            {value: 0.05, label: "(Default)"},
            {value: 0.01, label: "1 cm"},
            {value: 0.1, label: "10 cm"},
            {value: 0.25, label: "25 cm"},
            {value: .5, label: ".5 m"}]
    private createSnapArray: SnapValue[] =
        [{value: .1, label: "Default (10 cm)"},
            {value: 0.2, label: "20 cm"},
            {value: 0.5, label: ".5 m"},
            {value: 1, label: "1 m"}];
    private rotateSnapArray: SnapValue[] =
        [{value: 0, label: "Off"},
            {value: 22.5, label: "22.5 Degrees"},
            {value: 45, label: "45 Degrees"},
            {value: 90, label: "90 Degrees"}];
    private turnSnapArray: SnapValue[] =
        [{value: 0, label: "Off"},
            {value: 22.5, label: "22.5 Degrees"},
            {value: 45, label: "45 Degrees"},
            {value: 90, label: "90 Degrees"}];

    public get currentGridSnap(): SnapValue {
        return this.gridSnapArray[this.gridSnap];
    }

    public get physicsEnabled(): boolean {
        return this._physicsEnabled;
    }

    public set phsyicsEnabled(val: boolean) {
        this._physicsEnabled = val;
        this.save();
    }

    private static _config: AppConfig;

    public static get config() {
        if (!AppConfig._config) {
            AppConfig._config = new AppConfig();
        }
        return AppConfig._config;
    }

    public get currentRotateSnap(): SnapValue {
        return this.rotateSnapArray[this.rotateSnap];
    }

    public get currentCreateSnap(): SnapValue {
        return this.createSnapArray[this.createSnap];
    }

    public get currentTurnSnap(): SnapValue {
        return this.turnSnapArray[this._turnSnap];
    }

    public get currentGridSnapIndex(): number {
        return this.gridSnap;
    }

    public set currentTurnSnapIndex(val: number) {
        this._turnSnap = val;
        this.save();
    }

    public set currentGridSnapIndex(val: number) {
        this.gridSnap = val;
        this.save();
    }

    public get currentCreateSnapIndex(): number {
        return this.createSnap;
    }

    public set currentCreateSnapIndex(val: number) {
        this.createSnap = val;
        if (this.currentGridSnapIndex == this.defaultGridSnapIndex) {
            this.currentGridSnap.value = this.currentCreateSnap.value / 2;
            this.logger.debug("Set grid snap to " + this.currentGridSnap.value);
        }
        this.save();
    }

    public get currentRotateSnapIndex(): number {
        return this.rotateSnap;
    }

    public set currentRotateSnapIndex(val: number) {
        this.rotateSnap = val;
        this.save();
    }

    public get createSnapVal(): Vector3 {
        return new Vector3(this.currentCreateSnap.value, this.currentCreateSnap.value, this.currentCreateSnap.value);
    }

    public setPersistenceManager(persistenceManager: IPersistenceManager) {
        this.persistenceManager = persistenceManager;
        this.persistenceManager.configObserver.add(this.configObserver, -1, false, this);
    }

    public gridSnaps(): SnapValue[] {
        return this.gridSnapArray;
    }

    public turnSnaps(): SnapValue[] {
        return this.turnSnapArray;
    }

    public createSnaps(): SnapValue[] {
        return this.createSnapArray;
    }

    public rotateSnaps(): SnapValue[] {
        return this.rotateSnapArray;
    }

    public snapGridVal(value: Vector3): Vector3 {
        if (this.currentGridSnapIndex == 0) {
            return value;
        }
        const position = value.clone();
        position.x = round(position.x, this.currentGridSnap.value);
        position.y = round(position.y, this.currentGridSnap.value);
        position.z = round(position.z, this.currentGridSnap.value);
        return position;
    }

    public snapRotateVal(value: Vector3): Vector3 {
        if (this.currentRotateSnapIndex == 0) {
            return value;
        }
        const rotation = new Vector3();
        rotation.x = this.snapAngle(value.x);
        rotation.y = this.snapAngle(value.y);
        rotation.z = this.snapAngle(value.z);
        return rotation;
    }

    private snapAngle(val: number): number {
        const deg = Angle.FromRadians(val).degrees();
        const snappedDegrees = round(deg, this.currentRotateSnap.value);
        this.logger.debug("deg", val, deg, snappedDegrees, this.currentRotateSnap.value);
        return Angle.FromDegrees(snappedDegrees).radians();
    }

    private save() {
        this.persistenceManager.setConfig(
            {
                gridSnap: this.currentGridSnap.value,
                rotateSnap: this.currentRotateSnap.value,
                createSnap: this.currentCreateSnap.value,
                turnSnap: this.currentTurnSnap.value,
                physicsEnabled: this._physicsEnabled
            });
    }

    private configObserver(config: AppConfigType) {
        if (config) {
            if (config.physicsEnabled && config.physicsEnabled != this._physicsEnabled) {
                this._physicsEnabled = config.physicsEnabled;
                this.logger.debug("Physics enabled changed to " + this._physicsEnabled);
            }
            if (config.createSnap != this.currentCreateSnap.value ||
                config.gridSnap != this.currentGridSnap.value ||
                config.rotateSnap != this.currentRotateSnap.value) {
                this.logger.debug("Config changed", config);
                this._turnSnap = this.turnSnapArray.findIndex((snap) => snap.value == config.turnSnap);
                if (!this._turnSnap || this._turnSnap == -1) {
                    this._turnSnap = 0;
                }
                this.rotateSnap = this.rotateSnapArray.findIndex((snap) => snap.value == config.rotateSnap);
                this.createSnap = this.createSnapArray.findIndex((snap) => snap.value == config.createSnap);
                const gridSnap = this.gridSnapArray.findIndex((snap) => snap.value == config.gridSnap);
                if (gridSnap == -1) {
                    this.gridSnap = this.defaultGridSnapIndex;
                    this.currentGridSnap.value = config.gridSnap;
                }
            } else {
                this.logger.debug("Config unchanged", config);
            }
        } else {
            this.logger.debug("Config not set");
        }
    }
}
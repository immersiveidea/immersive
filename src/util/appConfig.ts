import {Logger, Observable} from "@babylonjs/core";
import log from "loglevel";
import {AppConfigType, HandleConfig, LabelRenderingMode} from "./appConfigType";

export class AppConfig {
    public readonly onConfigChangedObservable = new Observable<AppConfigType>();
    private _currentConfig: AppConfigType;
    private _logger = log.getLogger("appConfig");
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
        labelRenderingMode: 'billboard',
        handles: []  // Empty array by default, populated as handles are created
    }

    constructor() {
        // Create a fresh copy of defaults to avoid reference issues
        this._currentConfig = {...this.defaultConfig, handles: []};

        try {
            const storedConfig = localStorage.getItem('appConfig');

            if (storedConfig) {
                // Only parse if we have a non-null value
                const parsedConfig = JSON.parse(storedConfig);
                this._currentConfig = parsedConfig;

                // Ensure handles array exists
                if (!this._currentConfig.handles) {
                    this._currentConfig.handles = [];
                }

                this._logger.debug('AppConfig loaded from localStorage:', parsedConfig);
            } else {
                // No config in localStorage, save defaults
                this._logger.debug('No stored config found, initializing with defaults');
            }

            // Migrate old handle localStorage keys to new handles array

            // Save config (will include migrated handles if any)
            localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));

        } catch (err) {
            this._logger.error('Error loading appConfig from localStorage:', err);
            this._logger.debug('Using default config instead');
            // On error, ensure we have a valid config and save it
            this._currentConfig = {...this.defaultConfig, handles: []};
            localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));
        }

        this.onConfigChangedObservable.add((config) => {
            this._currentConfig = config;
        }, -1);
    }



    /**
     * Get a human-readable label for a handle ID
     * @private
     */
    private getLabelForHandleId(handleId: string): string {
        const labelMap: Record<string, string> = {
            'handle-toolbox': 'Toolbox',
            'handle-vrConfigPanelBase': 'Configuration',
            'handle-input': 'Input'
        };
        return labelMap[handleId] || handleId;
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

    /**
     * Get handle configuration by ID
     * @param id Handle ID (e.g., "handle-toolbox")
     * @returns HandleConfig if found, undefined otherwise
     */
    public getHandleConfig(id: string): HandleConfig | undefined {
        if (!this._currentConfig.handles) {
            this._currentConfig.handles = [];
        }
        return this._currentConfig.handles.find(h => h.id === id);
    }

    /**
     * Set or update handle configuration
     * If handle exists, updates it. If not, adds it to the array.
     * @param config HandleConfig to save
     */
    public setHandleConfig(config: HandleConfig) {
        if (!this._currentConfig.handles) {
            this._currentConfig.handles = [];
        }

        const existingIndex = this._currentConfig.handles.findIndex(h => h.id === config.id);

        if (existingIndex >= 0) {
            // Update existing handle config
            this._currentConfig.handles[existingIndex] = config;
            this._logger.debug(`Updated handle config for ${config.id}`);
        } else {
            // Add new handle config
            this._currentConfig.handles.push(config);
            this._logger.debug(`Added new handle config for ${config.id}`);
        }

        this.save();
    }

    /**
     * Remove handle configuration by ID
     * @param id Handle ID to remove
     */
    public removeHandleConfig(id: string) {
        if (!this._currentConfig.handles) {
            return;
        }

        const initialLength = this._currentConfig.handles.length;
        this._currentConfig.handles = this._currentConfig.handles.filter(h => h.id !== id);

        if (this._currentConfig.handles.length < initialLength) {
            this._logger.debug(`Removed handle config for ${id}`);
            this.save();
        }
    }

    /**
     * Get all handle configurations
     * @returns Array of all HandleConfig objects
     */
    public getAllHandleConfigs(): HandleConfig[] {
        return this._currentConfig.handles || [];
    }

    private save() {
        localStorage.setItem('appConfig', JSON.stringify(this._currentConfig));
        this.onConfigChangedObservable.notifyObservers(this._currentConfig, -1);
    }
}

// Singleton instance for app-wide configuration
// Use this instead of creating new AppConfig() instances
export const appConfigInstance = new AppConfig();
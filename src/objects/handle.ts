import {
    Color3,
    DynamicTexture,
    ICanvasRenderingContext,
    MeshBuilder,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import log, {Logger} from "loglevel";
import {split} from "canvas-hypertxt";
import {appConfigInstance} from "../util/appConfig";

/**
 * Options for creating a Handle instance
 */
export interface HandleOptions {
    /** The TransformNode that will be parented to this handle */
    contentMesh: TransformNode;
    /** Display label for the handle (default: 'Handle') */
    label?: string;
    /** Default position offset if no stored position exists (default: Vector3.Zero()) */
    defaultPosition?: Vector3;
    /** Default rotation if no stored rotation exists (default: Vector3.Zero()) */
    defaultRotation?: Vector3;
    /** Whether to automatically parent the handle to the platform (default: true) */
    autoParentToPlatform?: boolean;
}

/**
 * A grabbable, labeled plane mesh for VR interfaces with automatic position persistence.
 *
 * Features:
 * - Automatically saves and restores position/rotation to localStorage
 * - Can automatically parent itself to the platform mesh
 * - Creates a labeled visual handle for VR interaction
 *
 * @example
 * ```typescript
 * const handle = new Handle({
 *   contentMesh: myMenu,
 *   label: 'Configuration',
 *   defaultPosition: new Vector3(0.5, 1.6, 0.4),
 *   defaultRotation: new Vector3(0.5, 0.6, 0)
 * });
 * ```
 */
export class Handle {
    /** The TransformNode representing the handle mesh */
    public transformNode: TransformNode;

    private readonly _contentMesh: TransformNode;
    private _hasStoredPosition: boolean = false;
    private readonly _defaultPosition: Vector3;
    private readonly _defaultRotation: Vector3;
    private readonly _label: string;
    private readonly _autoParentToPlatform: boolean;
    private readonly _logger: Logger = log.getLogger('Handle');

    /**
     * Creates a new Handle instance
     * @param options Configuration options for the handle
     */
    constructor(options: HandleOptions) {
        this._contentMesh = options.contentMesh;
        this._label = options.label ?? 'Handle';
        this._defaultPosition = options.defaultPosition ?? Vector3.Zero();
        this._defaultRotation = options.defaultRotation ?? Vector3.Zero();
        this._autoParentToPlatform = options.autoParentToPlatform ?? true;

        this._logger.debug(`Handle created with label: ${this._label}`);
        this.buildHandle();

        if (this._autoParentToPlatform) {
            this.setupPlatformParenting();
        }
    }

    /**
     * Returns true if a stored position was found and restored from localStorage
     */
    public get hasStoredPosition(): boolean {
        return this._hasStoredPosition;
    }

    /**
     * Automatically parents the handle to the platform mesh when it becomes available
     * @private
     */
    private setupPlatformParenting(): void {
        const scene: Scene = this._contentMesh.getScene();
        const platform = scene.getMeshByID('platform');

        if (platform) {
            this._logger.debug(`Platform found, parenting handle to platform`);
            this.transformNode.parent = platform;
        } else {
            this._logger.debug(`Platform not found, waiting for platform creation`);
            // Wait for platform to be created
            const observer = scene.onNewMeshAddedObservable.add((mesh) => {
                if (mesh.id === 'platform') {
                    this._logger.debug(`Platform created, parenting handle to platform`);
                    this.transformNode.parent = mesh;
                    scene.onNewMeshAddedObservable.remove(observer);
                }
            });
        }
    }

    private buildHandle(): void {
        const scene: Scene = this._contentMesh.getScene();

        const handle = MeshBuilder.CreatePlane('handle-' + this._contentMesh.id, {width: .4, height: .4 / 8}, scene);
        const texture = this.drawText(this._label, Color3.White(), Color3.Black());
        const material = new StandardMaterial('handleMaterial', scene);
        material.metadata = { isUI: true };  // Mark as UI to prevent rendering mode modifications
        material.emissiveTexture = texture;
        material.opacityTexture = texture;
        material.disableLighting = true;
        handle.material = material;

        handle.id = 'handle-' + this._contentMesh.id;
        handle.metadata = {handle: true};

        // Parent content mesh to handle
        if (this._contentMesh) {
            this._contentMesh.setParent(handle);
        }

        // Attempt to restore position/rotation from localStorage
        this.restorePosition(handle);

        this.transformNode = handle;
    }

    /**
     * Restores position and rotation from AppConfig handles array, or applies defaults
     * @private
     */
    private restorePosition(handle: TransformNode): void {
        const handleId = handle.id;
        const savedConfig = appConfigInstance.getHandleConfig(handleId);

        if (savedConfig) {
            this._logger.debug(`Stored handle config found for ${handleId}:`, savedConfig);

            try {
                const pos = savedConfig.position;
                const rot = savedConfig.rotation;

                if (pos && rot &&
                    typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number' &&
                    typeof rot.x === 'number' && typeof rot.y === 'number' && typeof rot.z === 'number') {

                    // Convert Vec3 to Vector3
                    handle.position = new Vector3(pos.x, pos.y, pos.z);
                    handle.rotation = new Vector3(rot.x, rot.y, rot.z);
                    this._hasStoredPosition = true;
                    this._logger.debug(`Position restored from AppConfig for ${handleId}`);
                } else {
                    this._logger.warn(`Invalid saved config format for ${handleId}, using defaults`);
                    this.applyDefaultPosition(handle);
                }
            } catch (e) {
                this._logger.error(`Error restoring handle position for ${handleId}:`, e);
                this.applyDefaultPosition(handle);
            }
        } else {
            this._logger.debug(`No saved config found for ${handleId}, using defaults`);
            this.applyDefaultPosition(handle);
        }
    }

    /**
     * Applies the default position and rotation to the handle
     * @private
     */
    private applyDefaultPosition(handle: TransformNode): void {
        handle.position = this._defaultPosition;
        handle.rotation = this._defaultRotation;
    }

    /**
     * Draws text label onto a dynamic texture for the handle
     * @private
     */
    private drawText(name: string, foreground: Color3, background: Color3): DynamicTexture {
        const texture = new DynamicTexture(`${name}-handle-texture}`, {width: 512, height: 64}, this._contentMesh.getScene());
        const ctx: ICanvasRenderingContext = texture.getContext();
        const ctx2d: CanvasRenderingContext2D = (ctx.canvas.getContext('2d') as CanvasRenderingContext2D);
        const font = `900 24px Arial`;
        ctx2d.font = font;
        ctx2d.textBaseline = 'middle';
        ctx2d.textAlign = 'center';
        ctx2d.roundRect(0, 0, 512, 64, 32);
        ctx2d.fillStyle = background.toHexString();
        ctx2d.fill();
        ctx2d.fillStyle = foreground.toHexString();
        const lines = split(ctx2d, name, font, 512, true);
        const x = 256;
        let y = 32;
        for (const line of lines) {
            ctx2d.fillText(line, x, y);
            y += 50;
        }
        texture.update();
        return texture;
    }
}
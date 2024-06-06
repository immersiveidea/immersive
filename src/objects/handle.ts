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

export class Handle {
    public mesh: TransformNode;
    private readonly _menuItem: TransformNode;
    private _isStored: boolean = false;
    private _offset: Vector3;
    private _rotation: Vector3;
    private readonly _label: string;
    private readonly _logger: Logger = log.getLogger('Handle');

    constructor(mesh: TransformNode, label: string = 'Handle', offset: Vector3 = Vector3.Zero(), rotation: Vector3 = Vector3.Zero()) {
        this._menuItem = mesh;
        this._offset = offset;
        this._rotation = rotation;
        this._label = label;
        this._logger.debug('Handle created with label  ' + label);
        this.buildHandle();
    }

    public get idStored() {
        return this._isStored;
    }

    public staort() {

    }

    private buildHandle() {
        const scene: Scene = this._menuItem.getScene();


        const handle = MeshBuilder.CreatePlane('handle-' + this._menuItem.id, {width: .4, height: .4 / 8}, scene);
        //button.transform.scaling.set(.1,.1,.1);
        const texture = this.drawText(this._label, Color3.White(), Color3.Black());
        const material = new StandardMaterial('handleMaterial', scene);
        material.emissiveTexture = texture;
        material.disableLighting = true;
        handle.material = material;
        //handle.rotate(Vector3.Up(), Math.PI);
        handle.id = 'handle-' + this._menuItem.id;
        if (this._menuItem) {
            this._menuItem.setParent(handle);
        }

        const stored = localStorage.getItem(handle.id);
        if (stored) {
            this._logger.debug('Stored location found for ' + handle.id);
            try {
                const locationdata = JSON.parse(stored);
                this._logger.debug('Stored location data found ', locationdata);

                handle.position = new Vector3(locationdata.position.x, locationdata.position.y, locationdata.position.z);
                handle.rotation = new Vector3(locationdata.rotation.x, locationdata.rotation.y, locationdata.rotation.z);
                this._isStored = true;
            } catch (e) {
                this._logger.error(e);
                handle.position = Vector3.Zero();
            }
        } else {
            this._logger.debug('No stored location found for ' + handle.id + ', using defaults');
            handle.position = this._offset;
            handle.rotation = this._rotation;
        }
        handle.metadata = {handle: true};
        this.mesh = handle;

    }

    private drawText(name: string, foreground: Color3, background: Color3): DynamicTexture {
        const texture = new DynamicTexture('handleTexture', {width: 512, height: 64}, this._menuItem.getScene());
        const ctx: ICanvasRenderingContext = texture.getContext();
        const ctx2d: CanvasRenderingContext2D = (ctx.canvas.getContext('2d') as CanvasRenderingContext2D);
        const font = `900 24px Arial`;
        ctx2d.font = font;
        ctx2d.textBaseline = 'middle';
        ctx2d.textAlign = 'center';
        ctx2d.fillStyle = background.toHexString();
        ctx2d.fillRect(0, 0, 512, 64);
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
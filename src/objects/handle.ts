import {AbstractMesh, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {HtmlMeshBuilder} from "babylon-html";
import log, {Logger} from "loglevel";

export class Handle {
    public mesh: AbstractMesh;
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
        const handle = HtmlMeshBuilder.CreatePlaneSync('handle-' + this._menuItem.id, {
            html:
                `<div style="width: 100%; height: 100%; border-radius: 32px; background-color: #111122; color: #eeeeee"><center>${this._label}</center></div>
        `, width: .5, height: .1, image: {width: 256, height: 51}
        }, scene);
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

}
import {AbstractMesh, Angle, Color3, MeshBuilder, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import log, {Logger} from "loglevel";
import {MaptilerMap} from "../maps/maptilerMap";

export class CameraMenu {
    private readonly _scene: Scene;
    private readonly _logger: Logger = log.getLogger('CameraMenu');

    constructor(scene: Scene) {
        this._scene = scene;
        this.buildMap();
    }

    private buildMap() {
        const maptilerMap = new MaptilerMap('YnvhjBiU8oCWP0GXNdHL', this._scene, 'map-node', 3);
        maptilerMap.node.position.y = 3;
        maptilerMap.node.position.z = -4;
        maptilerMap.node.rotation.y = Math.PI;
        maptilerMap.node.rotation.x = Angle.FromDegrees(10).radians()
        maptilerMap.node.scaling = new Vector3(1, 1, 1);
        maptilerMap.setLocation('loves park, il', 16).then(() => {
            //maptilerMap.plotPoint(42.33181896128866, -88.86844896012006, this.buildPoint());
        });
        maptilerMap.onPickObservable.add((evt) => {
            maptilerMap.plotPoint(evt.lat, evt.lon, this.buildPoint());
        });
    }

    private buildPoint(): AbstractMesh {
        const mesh = MeshBuilder.CreateIcoSphere('point', {radius: .02}, this._scene);
        const material: StandardMaterial = new StandardMaterial('pointMat', this._scene);
        material.diffuseColor = Color3.Red();
        mesh.material = material;
        mesh.isPickable = true;
        return mesh;
    }
}
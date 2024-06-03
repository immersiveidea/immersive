import {
    AbstractMesh,
    ActionManager,
    Color3,
    ExecuteCodeAction,
    InstancedMesh,
    Mesh,
    Scene,
    SceneLoader,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";
import {CameraWindow} from "../objects/cameraWindow";

export class CameraIcon {
    private static _baseMesh: AbstractMesh;
    private readonly _scene: Scene;
    private _cams: CameraWindow[] = [];

    constructor(scene: Scene, mapNode: TransformNode, position: Vector3) {
        this._scene = scene;
        if (!CameraIcon._baseMesh) {
            this.loadIcon();
        }
        const newInstance = new InstancedMesh('cam', CameraIcon._baseMesh as Mesh);
        newInstance.setParent(mapNode);
        newInstance.position = position;
        newInstance.actionManager = new ActionManager(this._scene);
        newInstance.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            if (this._cams && this._cams.length > 0) {
                for (const cam of this._cams) {
                    cam.dispose();
                }
                this._cams = [];
            } else {
                for (let i = 1; i < 7; i++) {
                    const cam = new CameraWindow(scene, null, 'https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=' + i);
                    cam.mesh.position.x = newInstance.absolutePosition.x + (-2 + i);
                    cam.mesh.position.z = newInstance.absolutePosition.z;
                    cam.mesh.position.y = newInstance.absolutePosition.y + .5;
                    this._cams.push(cam);
                }

            }
        }));

        //newInstance.billboardMode = Mesh.BILLBOARDMODE_ALL;
    }

    private loadIcon() {
        SceneLoader.ImportMesh('', '/assets/models/', 'tinker.obj', this._scene,
            (newMesh) => {
                const myMesh = newMesh[0].getChildren()[0] as Mesh;
                //myMesh.position = new Vector3(0, 1.5, 0);
                myMesh.metadata = {grabbable: true};
                const SCALE = .006;
                myMesh.scaling = new Vector3(SCALE, SCALE, SCALE);
                myMesh.rotation.x = Math.PI / 2;
                const material = new StandardMaterial('icon-material', DefaultScene.Scene);
                material.emissiveColor = new Color3(.1, .1, .9);
                material.disableLighting = true;
                myMesh.material = material;
                myMesh.name = 'cam';
                myMesh.setEnabled(false);
                myMesh.setParent(null);
                newMesh[0].dispose();
                CameraIcon._baseMesh = myMesh;
            })
    }
}

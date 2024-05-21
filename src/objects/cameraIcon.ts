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
import {CameraWindow} from "./cameraWindow";

export class CameraIcon {
    private static _baseMesh: AbstractMesh;
    private readonly _scene: Scene;
    private _cam: CameraWindow;

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
            if (this._cam) {
                this._cam.dispose();
                this._cam = null;
            } else {
                this._cam = new CameraWindow(scene, null, 'https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=3');
                this._cam.mesh.position.x = newInstance.absolutePosition.x;
                this._cam.mesh.position.z = newInstance.absolutePosition.z;
                this._cam.mesh.position.y = newInstance.absolutePosition.y + .5;
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

import {AbstractMesh, DynamicTexture, MeshBuilder, Scene, StandardMaterial, TransformNode} from "@babylonjs/core";

export class CameraWindow {
    private readonly _scene: Scene;
    private readonly _url: string;
    private readonly _parent: TransformNode;
    private readonly _intervalId: number;
    private _cameraMesh: AbstractMesh;
    private _img: HTMLImageElement;

    constructor(scene: Scene, parent: TransformNode, url: string) {
        this._scene = scene;
        this._parent = parent;
        this._url = url;
        this.build();

    }

    public get mesh() {
        return this._cameraMesh;
    }

    public dispose() {
        window.clearInterval(this._intervalId);
        this._cameraMesh.dispose(false, true);
        this._img.remove();
    }

    private build() {
        this._cameraMesh = MeshBuilder.CreatePlane('cam-' + this._url, {width: 1, height: 1}, this._scene);
        this._cameraMesh.parent = this._parent;
        //camerasphere.position = position;
        const material = new StandardMaterial("cameramaterial", this._scene);
        //material.emissiveColor = new Color3(1, 1, 1);
        material.backFaceCulling = false;
        const texture = new DynamicTexture('texture', {width: 1600, height: 1600}, this._scene);
        material.emissiveTexture = texture;
        material.disableLighting = true;
        this._img = new Image();

        this._img.setAttribute('crossorigin', 'anonymous');
        //img.src = 'https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=' + camnum;
        this._img.src = this._url;
        const ctx = texture.getContext();
        this._img.onload = () => {
            ctx.drawImage(this._img, 0, 0);
            texture.update();
            window.setInterval((texture, img, ctx) => {
                ctx.drawImage(img, 0, 0);
                texture.update();
            }, 1000, texture, this._img, ctx);
        }

        texture.onLoadObservable.add(() => {

        });
        this._cameraMesh.material = material;
    }
}
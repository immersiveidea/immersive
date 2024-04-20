import {DefaultScene} from "../defaultScene";
import {HtmlButton, HtmlMeshBuilder} from "babylon-html";
import {AbstractMesh, Observable, TransformNode, Vector3} from "@babylonjs/core";


export class ScaleMenu {
    private static Sizes = [
        .025, .05, .1, .25, .5, 1.0, 2.0, 3.0, 4.0, 5.0
    ]
    public readonly onScaleChangeObservable: Observable<AbstractMesh> = new Observable<AbstractMesh>();
    private readonly transform;
    private _mesh: AbstractMesh;

    constructor() {
        this.transform = new TransformNode("scaleMenu", DefaultScene.Scene);
        this.transform.scaling = new Vector3(.5, .5, .5);
        this.build();
    }

    public changePosition(position: Vector3) {
        this.transform.position = position.clone();
    }

    public show(mesh: AbstractMesh) {
        this.transform.position = mesh.absolutePosition.clone();
        this.transform.position.y = mesh.getBoundingInfo().boundingBox.maximumWorld.y + .1;
        this.transform.setEnabled(true);
        this._mesh = mesh;
    }

    public hide() {
        this.transform.setEnabled(false);
        this._mesh = null;
    }

    private async build() {
        let x = .12;
        const xParent = new TransformNode("xParent", DefaultScene.Scene);
        xParent.parent = this.transform;
        const yParent = new TransformNode("yParent", DefaultScene.Scene);
        yParent.parent = this.transform;
        const zParent = new TransformNode("zParent", DefaultScene.Scene);
        zParent.parent = this.transform;
        xParent.rotation.x = Math.PI / 2;
        yParent.rotation.z = Math.PI / 2;
        yParent.billboardMode = TransformNode.BILLBOARDMODE_Y;
        zParent.rotation.y = Math.PI / 2;
        zParent.rotation.x = Math.PI / 2;
        for (const size of ScaleMenu.Sizes) {
            const xbutton = this.makeButton(size.toString(), x, 0, xParent);
            xbutton.onPointerObservable.add((eventData) => {
                if (eventData.sourceEvent.type == "pointerup") {
                    this.scaleX(size)
                }
            }, -1, false, this, false);

            const ybutton = this.makeButton(size.toString(), x, Math.PI / 2, yParent);
            ybutton.onPointerObservable.add((eventData) => {
                if (eventData.sourceEvent.type == "pointerup") {
                    this.scaleY(size)
                }
            }, -1, false, this, false);

            const zbutton = this.makeButton(size.toString(), x, -Math.PI / 2, zParent);
            zbutton.onPointerObservable.add((eventData) => {
                if (eventData.sourceEvent.type == "pointerup") {
                    this.scaleZ(size)
                }
            }, -1, false, this, false);
            x += .11;
        }
//        const labelX = await this.createLabel('X Size', .3);
        //      const labelY = await this.createLabel('Y Size', .2);
        //    const labelZ = await this.createLabel('Z Size', .1);
        this.transform.position.y = 1;
        this.transform.rotation.y = Math.PI;
        this.transform.setEnabled(false);
    }

    private makeButton(name: string, x: number, y: number, parent: TransformNode = null) {
        const button = new HtmlButton(name, name, DefaultScene.Scene);
        button.transform.parent = parent;
        button.transform.position.x = x;
        //button.transform.position.y = y;
        button.transform.rotation.z = y;
        button.transform.rotation.y = Math.PI;
        return button;
    }

    private scaleX(size: number) {
        if (this._mesh) {
            this._mesh.scaling.x = size;
            this.scaleChanged();
        }
    }

    private scaleY(size: number) {
        if (this._mesh) {
            this._mesh.scaling.y = size;
            this.scaleChanged();
        }
    }

    private scaleZ(size: number) {
        if (this._mesh) {
            this._mesh.scaling.z = size;
            this.scaleChanged();
        }
    }

    private scaleChanged() {
        if (this._mesh) {
            this.onScaleChangeObservable.notifyObservers(this._mesh);
        }
    }

    private async createLabel(name: string, y: number) {
        const label = await HtmlMeshBuilder.CreatePlane(`${name}-label`,
            {
                html: `<div style='margin: 0; padding-top: 40px; font-size: 32px; text-align: center; color:#ffffff; background: #000000; width: 128px; height: 128px'>${name}</div>`,
                height: .1, image: {width: 128, height: 128}
            },
            DefaultScene.Scene);

        label.parent = this.transform;
        label.position.y = y;
        label.position.x = -.42;
        return label;
    }
}

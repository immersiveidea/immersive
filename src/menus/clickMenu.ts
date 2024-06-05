import {AbstractMesh, ActionEvent, Observable, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {HtmlButton} from "babylon-html";

const POINTER_UP = "pointerup";

export class ClickMenu {
    private readonly _mesh: AbstractMesh;
    private readonly _transformNode: TransformNode;
    public onClickMenuObservable: Observable<ActionEvent> = new Observable<ActionEvent>();

    constructor(mesh: AbstractMesh) {
        this._mesh = mesh;
        const scene = mesh.getScene();
        this._transformNode = new TransformNode("transform", scene);
        let x = -.54 / 2;

        this.makeNewButton("Remove", "remove", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);


        this.makeNewButton("Label", "label", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        this.makeNewButton("Connect", "connect", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);

        this.makeNewButton("Size", "size", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
            }
        }, -1, false, this, false);

        this.makeNewButton("Close", "close", scene, x += .11)
            .onPointerObservable.add((eventData) => {
            if (isUp(eventData)) {
                this.onClickMenuObservable.notifyObservers(eventData);
                this.dispose();
            }
        }, -1, false, this, false);


        const platform = scene.getMeshByName("platform");
        const ray = scene.activeCamera.getForwardRay(1);
        ray.direction.y = 0;
        const fpos = scene.activeCamera.globalPosition.clone().add(ray.direction.scale(1));
        this._transformNode.position = fpos;
        this._transformNode.position.y -= .4;
        this._transformNode.lookAt(scene.activeCamera.globalPosition);
        this._transformNode.rotate(Vector3.Up(), Math.PI);
        this._transformNode.setParent(platform);
    }

    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    public dispose() {
        this._transformNode.dispose(false, true);
    }

    private makeNewButton(name: string, id: string, scene: Scene, x: number): HtmlButton {
        const button = new HtmlButton(name, id, scene, null, {html: null, image: {width: 268, height: 268}});
        const transform = button.transform;
        transform.parent = this._transformNode;
        transform.rotation.y = Math.PI;
        transform.position.x = x;
        return button;
    }
}

function isUp(event: ActionEvent): boolean {
    return event?.sourceEvent?.type == POINTER_UP;
}
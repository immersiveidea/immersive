import {AbstractMesh, ActionEvent, Observable, Scene, TransformNode} from "@babylonjs/core";
import {HtmlButton} from "babylon-html";

const POINTER_UP = "pointerup";

export class ClickMenu {
    private readonly _mesh: AbstractMesh;
    private readonly transform: TransformNode;
    public onClickMenuObservable: Observable<ActionEvent> = new Observable<ActionEvent>();

    constructor(mesh: AbstractMesh) {
        this._mesh = mesh;
        const scene = mesh.getScene();
        this.transform = new TransformNode("transform", scene);
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

        this.makeNewButton("Close", "close", scene, x += .11)
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

        const platform = scene.getMeshByName("platform");
        this.transform.parent = scene.activeCamera;
        this.transform.position.z = .7;
        this.transform.position.y = -.1;
        this.transform.setParent(platform);
        this.transform.rotation.z = 0;
    }

    public get mesh(): AbstractMesh {
        return this._mesh;
    }

    private makeNewButton(name: string, id: string, scene: Scene, x: number): HtmlButton {
        const button = new HtmlButton(name, id, scene, null, {html: null, image: {width: 268, height: 268}});
        const transform = button.transform;
        transform.parent = this.transform;
        transform.rotation.y = Math.PI;
        transform.position.x = x;
        return button;
    }

    private dispose() {
        this.transform.dispose(false, true);
    }
}

function isUp(event: ActionEvent): boolean {
    return event?.sourceEvent?.type == POINTER_UP;
}
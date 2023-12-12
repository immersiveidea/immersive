import {
    AssetContainer,
    Color3,
    Mesh,
    MeshBuilder,
    Observable,
    Scene,
    SceneLoader,
    TransformNode,
    Vector3
} from "@babylonjs/core";

import {Button3D, GUI3DManager, StackPanel3D, TextBlock} from "@babylonjs/gui";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {setMenuPosition} from "../util/functions/setMenuPosition";
import {buildColor} from "./functions/buildColor";

import log from "loglevel";
import {Handle} from "../objects/handle";

export class Toolbox {
    private readonly logger = log.getLogger('Toolbox');
    private index = 0;
    private readonly scene: Scene;
    public readonly node: TransformNode;
    private readonly manager: GUI3DManager;
    private readonly addPanel: StackPanel3D;
    private readonly controllers: Controllers;
    private readonly xObserver;
    public readonly colorChangeObservable: Observable<{ oldColor: string, newColor: string }> =
        new Observable<{ oldColor: string; newColor: string }>()
    private handle: Handle;
    constructor(scene: Scene, controllers: Controllers) {
        this.scene = scene;
        this.controllers = controllers;
        this.addPanel = new StackPanel3D();
        this.manager = new GUI3DManager(scene);
        this.manager.addControl(this.addPanel);
        this.node = new TransformNode("toolbox", this.scene);
        this.handle = new Handle(this.node);
        this.node.position.y = .1;
        this.node.position.z = .2;
        this.node.scaling = new Vector3(0.6, 0.6, 0.6);
        this.buildToolbox();

        if (!this.xObserver) {
            this.xObserver = this.controllers.controllerObserver.add((evt) => {
                if (evt.type == ControllerEventType.X_BUTTON) {
                    if (evt.value == 1) {
                        this.node.parent.setEnabled(!this.node.parent.isEnabled(false));
                        setMenuPosition(this.node.parent as Mesh, this.scene,
                            Vector3.Zero());
                    }
                }
            });
        }
    }

    public updateToolbox(color: string) {
        if (color) {
            if (this.scene.getMeshById("toolbox-color-" + color)) {
                return;
            } else {
                buildColor(Color3.FromHexString(color), this.scene, this.node, this.index++, this.colorChangeObservable);
            }
        } else {
            this.logger.warn("updateToolbox called with no color");
        }

    }

    private readonly objectObservable: Observable<AssetContainer> = new Observable();
    private buildToolbox() {

        const color = "#7777FF";
        buildColor(Color3.FromHexString(color), this.scene, this.node, this.index++, this.colorChangeObservable);
        const addButton = createButton();

        this.addPanel.node.parent = this.node.parent;
        this.addPanel.addControl(addButton);
        this.addPanel.node.scaling = new Vector3(.1, .1, .1);
        this.addPanel.position = new Vector3(-.25, 0, 0);
        //@TODO: move this somewhere else, just to prototype loading objects.
        //loadObject(this.scene, this.objectObservable);
        this.objectObservable.add((container) => {
            this.logger.debug("loaded object");
            const data = container.instantiateModelsToScene(undefined, false, {doNotInstantiate: true});
            const mesh = (data.rootNodes[0] as Mesh);
            const bounds = data.rootNodes[0].getHierarchyBoundingVectors(true);
            console.log(bounds);
            const size = bounds.max.subtract(bounds.min);
            const top = MeshBuilder.CreateBox("container", {width: size.x, height: size.y, depth: size.z}, this.scene);
            top.position.y = 1.5;
            top.metadata = {template: "#object-template", grabbable: true, tool: true};
            mesh.parent = top;
            mesh.position.y = -size.y / 2;
            top.position = new Vector3(-.6, .2, 0);
            //top.scaling = new Vector3(.1, .1, .1);
            top.visibility = 0;
            console.log(data.rootNodes.length);

        });
        addButton.onPointerClickObservable.add(() => {
            buildColor(Color3.Random(), this.scene, this.node, this.index++, this.colorChangeObservable);
        });
        //this.node.parent
        this.node.parent.setEnabled(false);
        setMenuPosition(this.node.parent as Mesh, this.scene,
            Vector3.Zero());
//
    }
}

function loadObject(scene: Scene, observable: Observable<AssetContainer>) {
    SceneLoader.LoadAssetContainer("/assets/models/",
        "server_racking_system.glb",
        scene,
        (container: AssetContainer) => {
            observable.notifyObservers(container);
        });


}
function createButton(): Button3D {
    const addButton = new Button3D("add-button");
    const text = new TextBlock("add-button-text", "Add Color");
    text.color = "white";
    text.fontSize = "48px";
    text.text = "Add Color";
    addButton.content = text;
    return addButton;
}
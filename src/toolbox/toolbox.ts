import {Color3, Mesh, MeshBuilder, Observable, Scene, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";

import {Button3D, GUI3DManager, StackPanel3D, TextBlock} from "@babylonjs/gui";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {setMenuPosition} from "../util/functions/setMenuPosition";
import {buildColor} from "./functions/buildColor";

export class Toolbox {
    private index = 0;
    private readonly scene: Scene;
    public readonly node: TransformNode;
    private readonly manager: GUI3DManager;
    private readonly addPanel: StackPanel3D;
    private readonly controllers: Controllers;
    private readonly xObserver;
    public readonly colorChangeObservable: Observable<{ oldColor: string, newColor: string }> =
        new Observable<{ oldColor: string; newColor: string }>()

    constructor(scene: Scene, controllers: Controllers) {
        this.scene = scene;
        this.controllers = controllers;
        this.addPanel = new StackPanel3D();
        this.manager = new GUI3DManager(scene);
        this.manager.addControl(this.addPanel);
        this.node = new TransformNode("toolbox", this.scene);
        const handle = MeshBuilder.CreateCapsule("handle", {
            radius: .05,
            orientation: Vector3.Right(),
            height: .4
        }, this.scene);
        handle.id = "handle";
        const handleMaterial = new StandardMaterial("handle-material", this.scene);
        handleMaterial.diffuseColor = Color3.FromHexString("#EEEEFF");
        handleMaterial.alpha = .8;
        handle.material = handleMaterial;
        handle.position = Vector3.Zero();

        this.node.parent = handle;
        this.node.position.y = .1;
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
        if (this.scene.getMeshById("toolbox-color-" + color)) {
            return;
        } else {
            buildColor(Color3.FromHexString(color), this.scene, this.node, this.index++, this.colorChangeObservable);
        }
    }

    private buildToolbox() {

        const color = "#7777FF";
        buildColor(Color3.FromHexString(color), this.scene, this.node, this.index++, this.colorChangeObservable);
        const addButton = createButton();

        this.addPanel.node.parent = this.node.parent;
        this.addPanel.addControl(addButton);
        this.addPanel.node.scaling = new Vector3(.1, .1, .1);
        this.addPanel.position = new Vector3(-.25, 0, 0);

        addButton.onPointerClickObservable.add(() => {
            buildColor(Color3.Random(), this.scene, this.node, this.index++, this.colorChangeObservable);
        });

        this.node.parent.setEnabled(false);
    }
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
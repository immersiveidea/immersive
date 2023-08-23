import {
    AbstractMesh,
    Color3,
    InstancedMesh,
    Mesh,
    MeshBuilder,
    Observable,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";

import {CameraHelper} from "../util/cameraHelper";
import {AdvancedDynamicTexture, Button3D, ColorPicker, GUI3DManager, StackPanel3D, TextBlock} from "@babylonjs/gui";
import {Controllers} from "../controllers/controllers";

export enum ToolType {
    BOX = "#box-template",
    SPHERE = "#sphere-template",
    CYLINDER = "#cylinder-template",
    CONE = "#cone-template",
    PLANE = "#plane-template",
    OBJECT = "#object-template",
}

export class Toolbox {
    private index = 0;
    private readonly scene: Scene;
    public readonly node: TransformNode;
    private readonly manager: GUI3DManager;
    private readonly gridsize = 5;
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
        handleMaterial.alpha = .5;
        handle.material = handleMaterial;
        handle.position = Vector3.Zero();

        this.node.parent = handle;

        this.buildToolbox();

        if (!this.xObserver) {
            this.xObserver = this.controllers.controllerObserver.add((evt) => {
                if (evt.type == 'x-button') {
                    if (evt.value == 1) {
                        this.node.parent.setEnabled(!this.node.parent.isEnabled(false));
                        CameraHelper.setMenuPosition(this.node.parent as Mesh, this.scene,
                            new Vector3(0, 0, 0));
                    }
                }
            });
        }
    }

    public buildTool(tool: ToolType, parent: AbstractMesh) {
        const id = this.toolId(tool, (parent.material as StandardMaterial).diffuseColor);

        const newItem = this.buildMesh(tool, `tool-${id}`);
        if (!newItem) {
            return null;
        }
        newItem.material = parent.material;
        if (tool === ToolType.PLANE) {
            newItem.material.backFaceCulling = false;
        }
        newItem.scaling = new Vector3(Toolbox.WIDGET_SIZE,
            Toolbox.WIDGET_SIZE,
            Toolbox.WIDGET_SIZE);
        newItem.parent = parent;
        newItem.metadata = {template: tool};
        const instance = new InstancedMesh("instance-" + id, newItem);
        instance.metadata = {template: tool};
        instance.parent = parent;
        newItem.setEnabled(false);
        newItem.onEnabledStateChangedObservable.add(() => {
            instance.setEnabled(false);
        });
        return instance;

    }

    private buildMesh(type: ToolType, toolname: string): Mesh {
        switch (type) {
            case ToolType.BOX:
                return MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1}, this.scene);

            case ToolType.SPHERE:
                return MeshBuilder.CreateSphere(toolname, {diameter: 1}, this.scene);

            case ToolType.CYLINDER:
                return MeshBuilder.CreateCylinder(toolname, {height: 1, diameter: 1}, this.scene);

            case ToolType.CONE:
                return MeshBuilder.CreateCylinder(toolname, {
                    diameterTop: 0,
                    height: 1,
                    diameterBottom: 1
                }, this.scene);

            case ToolType.PLANE:
                return MeshBuilder.CreatePlane(toolname, {width: 1, height: 1}, this.scene);

            case ToolType.OBJECT:
                return null;

        }
    }

    private toolId(tool: ToolType, color: Color3) {
        return tool + "-" + color.toHexString();
    }

    private calculatePosition(i: number) {
        return (i / this.gridsize) - .5 - (1 / this.gridsize / 2);
    }

    private static WIDGET_SIZE = .1;

    private buildToolbox() {
        this.node.position.y = .1;
        this.node.scaling = new Vector3(0.6, 0.6, 0.6);
        const color = "#7777FF";
        this.buildColor(Color3.FromHexString(color));

        const addButton = new Button3D("add-button");
        const text = new TextBlock("add-button-text", "Add Color");
        text.color = "white";
        text.fontSize = "48px";
        text.text = "Add Color";
        addButton.content = text;
        this.addPanel.node.parent = this.node.parent;
        this.addPanel.addControl(addButton);
        this.addPanel.node.scaling = new Vector3(.1, .1, .1);
        this.addPanel.position = new Vector3(-.25, 0, 0);
        addButton.onPointerClickObservable.add(() => {
            this.buildColor(Color3.Random());
        });
        this.node.parent.setEnabled(false);

    }

    public updateToolbox(color: string) {
        if (this.scene.getMeshById("toolbox-color-" + color)) {
            return;
        } else {
            this.buildColor(Color3.FromHexString(color));
        }
    }

    private buildColor(color: Color3) {

        const width = 1;
        const depth = .2;
        const material = new StandardMaterial("material-" + color.toHexString(), this.scene);
        material.diffuseColor = color;
        const mesh = MeshBuilder.CreateBox("toolbox-color-" + color.toHexString(), {
            width: width,
            height: .01,
            depth: depth
        }, this.scene);
        mesh.material = material;
        mesh.position.z = this.index++ / 4;
        mesh.parent = this.node;
        mesh.metadata = {tool: 'color'};
        let i = 0;
        for (const tool of enumKeys(ToolType)) {
            const newItem = this.buildTool(ToolType[tool], mesh);
            if (newItem) {
                newItem.position = new Vector3(this.calculatePosition(++i), .1, 0);
            }
        }
        const colorPickerPlane = MeshBuilder
            .CreatePlane("colorPickerPlane",
                {
                    width: Toolbox.WIDGET_SIZE,
                    height: Toolbox.WIDGET_SIZE
                }, this.scene);
        const colorPickerTexture = AdvancedDynamicTexture.CreateForMesh(colorPickerPlane, 1024, 1024);
        colorPickerPlane.parent = mesh;
        colorPickerPlane.position = new Vector3(this.calculatePosition(++i), .1, 0);


        const colorPicker = new ColorPicker("color-picker");
        colorPicker.scaleY = 5;
        colorPicker.scaleX = 5;
        colorPicker.value = color;
        colorPicker.onValueChangedObservable.add((value) => {
            const oldColor = material.diffuseColor.clone();
            const newColor = value.clone();
            material.diffuseColor = newColor;
            const newColorHex = newColor.toHexString();
            material.id = "material-" + newColorHex;
            material.name = "material-" + newColorHex;
            mesh.id = "toolbox-color-" + newColorHex;
            mesh.name = "toolbox-color-" + newColorHex;
            this.colorChangeObservable.notifyObservers({
                oldColor: oldColor.toHexString(),
                newColor: newColor.toHexString()
            });
        });

        colorPickerTexture.addControl(colorPicker);

    }
}

function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
    return Object.keys(obj).filter(k => Number.isNaN(+k)) as K[];
}
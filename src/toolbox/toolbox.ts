import {
    AbstractMesh, Angle,
    Color3, InstancedMesh, Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial, TransformNode,
    Vector3,
    WebXRExperienceHelper
} from "@babylonjs/core";

import {CameraHelper} from "../util/cameraHelper";
import {AdvancedDynamicTexture, Button3D, ColorPicker, GUI3DManager, StackPanel3D, TextBlock} from "@babylonjs/gui";

export enum ToolType {
    BOX ="#box-template",
    Sphere="#sphere-template",
    Cylinder="#cylinder-template",
    Cone  ="#cone-template",
    PLANE   ="#plane-template",
    OBJECT  ="#object-template",
}

export class Toolbox {
    public static getToolTypeFromString(type: string): ToolType {
        return ToolType[Object.keys(ToolType).find(() => type)]
    }

    private index = 0;
    public static instance: Toolbox;
    private readonly scene: Scene;
    private readonly xr: WebXRExperienceHelper;
    public readonly node : TransformNode;
    private readonly manager: GUI3DManager;
    private readonly gridsize = 5;
    private addPanel: StackPanel3D;
    constructor (scene:Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.addPanel = new StackPanel3D();
        this.manager  = new GUI3DManager(scene);
        this.manager.addControl(this.addPanel);
        this.node = new TransformNode("toolbox", this.scene);
        const handle = MeshBuilder.CreateCapsule("handle", { radius: .01 , orientation: Vector3.Right(), height: .3}, this.scene);
        handle.id = "handle";
        const handleMaterial =  new StandardMaterial("handle-material", this.scene);
        handleMaterial.diffuseColor = Color3.FromHexString("#EEEEFF");
        handle.material = handleMaterial;
        handle.position = CameraHelper.getFrontPosition(2, this.scene);
        handle.position.y = 1.6;
        this.node.parent = handle;
        this.xr = xr;
        if (!this.scene.activeCamera) {
            return;
        } else {
            this.buildToolbox();
        }
        Toolbox.instance = this;
    }
    private buildToolbox() {
        this.node.position.y = -.2;
        this.node.scaling= new Vector3(0.5, 0.5, 0.5);
        const color = "#7777FF";
        this.buildColor(Color3.FromHexString(color));

        const addButton= new Button3D("add-button");
        const text = new TextBlock("add-button-text", "Add Color");
        text.color="white";
        text.fontSize = "48px";
        text.text = "Add Color";
        addButton.content = text;
        this.addPanel.node.parent = this.node;
        this.addPanel.addControl(addButton);
        this.addPanel.node.rotation =
            new Vector3(
                Angle.FromDegrees(0).radians(),
                Angle.FromDegrees(180).radians(),
                Angle.FromDegrees(0).radians());
        this.addPanel.node.scaling = new Vector3(.1, .1,.1);
        this.addPanel.position = new Vector3(0, 0, .5);
        addButton.onPointerClickObservable.add(() => {
           this.buildColor(Color3.Random());


        });

    }
    private calculatePosition(i: number) {
        return (i/this.gridsize)-.5-(1/this.gridsize/2);
    }
    private buildColor(color: Color3) {
        const width = 1;
        const depth = .2;
        const material = new StandardMaterial("material-" + color.toHexString(), this.scene);
        material.diffuseColor = color;
        const mesh = MeshBuilder.CreateBox("toolbox-color-" + color.toHexString(), {width: width, height: .01, depth: depth}, this.scene);
        mesh.material = material;
        mesh.position.z = this.index++/4;
        mesh.parent = this.node;
        let i = 0;
        for (const tool of enumKeys(ToolType)) {
            const newItem = this.buildTool(ToolType[tool], mesh);
            if (newItem) {
                newItem.position = new Vector3(this.calculatePosition(++i), .1, 0);
            }
        }
        const myPlane = MeshBuilder.CreatePlane("myPlane", {width: .1, height: .1}, this.scene);
        myPlane.parent=mesh;
        myPlane.position= new Vector3(this.calculatePosition(++i), .1, 0);

        const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(myPlane, 1024, 1024);
        const colorPicker = new ColorPicker("color-picker");
        colorPicker.scaleY = 5;
        colorPicker.scaleX = 5;
        colorPicker.value = color;
        colorPicker.onValueChangedObservable.add((value) => {
            material.diffuseColor = value;
            material.id = "material-" + value.toHexString();
            material.name = "material-" + value.toHexString();
            mesh.id = "toolbox-color-" + value.toHexString();
            mesh.name = "toolbox-color-" + value.toHexString();
        });

        advancedTexture2.addControl(colorPicker);
        this.addPanel.position.z += .25;
        this.node.position.z -= .125;
    }
    public updateToolbox(color: string) {
        if (this.scene.getMeshById("toolbox-color-" + color)) {
            return;
        } else {
            this.buildColor(Color3.FromHexString(color));
        }
    }
    private nextPosition() {

    }

    public buildTool(tool: ToolType, parent: AbstractMesh) {
        let newItem: Mesh;
        const id = tool + "-" + (parent.material as StandardMaterial).diffuseColor.toHexString();
        const material = parent.material;
        const toolname = "tool-" + id;
        switch (tool) {
            case ToolType.BOX:
                newItem = MeshBuilder.CreateBox(toolname, {width: 1, height: 1, depth: 1}, this.scene);
                break;
            case ToolType.Sphere:
                newItem = MeshBuilder.CreateSphere(toolname, {diameter: 1}, this.scene);
                break;
            case ToolType.Cylinder:
                newItem = MeshBuilder.CreateCylinder(toolname, {height: 1, diameter: 1}, this.scene);
                break;
            case ToolType.Cone:
                newItem = MeshBuilder.CreateCylinder(toolname, {diameterTop: 0, height: 1, diameterBottom: 1}, this.scene);
                break;
            case ToolType.PLANE:
                newItem = MeshBuilder.CreatePlane(toolname, {width: 1, height: 1}, this.scene);
                break;
            case ToolType.OBJECT:
                break;
        }
        if (newItem)  {
            newItem.material = material;
            newItem.id = "tool-" + id;
            if (tool === ToolType.PLANE) {
                newItem.material.backFaceCulling = false;
            }
            newItem.scaling = new Vector3(0.1, 0.1, 0.1);
            newItem.parent = parent;
            if (!newItem.material) {
                newItem.material = parent.material;
            }
            if (newItem.metadata) {
                newItem.metadata.template = tool;
            } else {
                newItem.metadata = {template: tool};
            }
            const instance = new InstancedMesh("instance-"+id, newItem);
            if (instance.metadata) {
                instance.metadata.template = tool;
            } else {
                instance.metadata = {template: tool};
            }
            instance.parent= parent;
            newItem.setEnabled(false)
            return instance;
        } else {
            return null;
        }
    }
    public show() {
        this.buildToolbox();
    }
}
function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
    return Object.keys(obj).filter(k => Number.isNaN(+k)) as K[];
}
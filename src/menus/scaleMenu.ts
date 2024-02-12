import {AbstractMesh, Scene, TransformNode, Vector3, WebXRDefaultExperience} from "@babylonjs/core";

import {Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {AbstractMenu} from "./abstractMenu";

import {GUI3DManager, Slider3D} from "@babylonjs/gui";

export class ScaleMenu extends AbstractMenu {
    private sounds: DiaSounds;
    private mesh: AbstractMesh;
    private xSlider: Slider3D;
    private ySlider: Slider3D;
    private zSlider: Slider3D;
    private transformNode: TransformNode;
    private xTransformNode: TransformNode;
    private yTransformNode: TransformNode;
    private zTransformNode: TransformNode;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);


        this.transformNode = new TransformNode("scaleMenu", scene);
        this.xTransformNode = new TransformNode("xTransformNode", scene);
        this.xTransformNode.parent = this.transformNode;

        this.yTransformNode = new TransformNode("yTransformNode", scene);
        this.yTransformNode.parent = this.transformNode;

        this.zTransformNode = new TransformNode("zTransformNode", scene);
        this.zTransformNode.parent = this.transformNode;

        //super.createHandle(this.transformNode);
        this.transformNode.position.y = 0;
        this.transformNode.position.z = 0;
        this.transformNode.position.x = 0;

        this.buildMenu();

        //this.transformNode.position.y = 2;

    }

    public changeMesh(mesh: AbstractMesh) {
        this.mesh = mesh;
        this.xSlider.value = mesh.scaling.x;
        this.ySlider.value = mesh.scaling.y;
        this.zSlider.value = mesh.scaling.z;

        const two = new Vector3(2, 2, 2);
        this.transformNode.position = this.mesh.absolutePosition.clone();
        this.transformNode.rotation = this.mesh.absoluteRotationQuaternion.toEulerAngles();

    }

    private buildMenu() {
        const manager = new GUI3DManager(this.scene);
        //manager.rootContainer.position.y = 2;
        //manager.rootContainer.node.position.y = 2;
        this.xSlider = new Slider3D("xslider");
        this.ySlider = new Slider3D("xslider");
        this.zSlider = new Slider3D("xslider");

        manager.addControl(this.xSlider);
        manager.addControl(this.ySlider);
        manager.addControl(this.zSlider);
        this.xSlider.linkToTransformNode(this.xTransformNode);
        this.ySlider.linkToTransformNode(this.yTransformNode);
        this.zSlider.linkToTransformNode(this.zTransformNode);

        this.xTransformNode.position = new Vector3(0, 0, .6);
        this.xTransformNode.rotation.y = Math.PI;
        this.yTransformNode.position = new Vector3(.6, .6, .6);
        this.yTransformNode.rotation.z = Math.PI / 2;
        this.zTransformNode.position = new Vector3(.6, .6, 0);
        this.zTransformNode.rotation.y = Math.PI / 2;
        setValues(this.xSlider);
        setValues(this.ySlider);
        setValues(this.zSlider);
        this.xSlider.onValueChangedObservable.add((value) => {
            if (this.mesh) {
                this.mesh.scaling.x = value;
            }
        });
        this.ySlider.onValueChangedObservable.add((value) => {
            if (this.mesh) {
                this.mesh.scaling.y = value;
            }
        });
        this.zSlider.onValueChangedObservable.add((value) => {
            if (this.mesh) {
                this.mesh.scaling.z = value;
            }
        });
        this.transformNode.scaling.x = .5;
        this.transformNode.scaling.y = .5;
        this.transformNode.scaling.z = .5;
    }

}

function setValues(slider: Slider3D) {
    slider.minimum = .1;
    slider.maximum = 1;
    slider.step = .1;
    slider.value = .1;
}
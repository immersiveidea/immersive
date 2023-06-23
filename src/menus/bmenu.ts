import {Angle, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {Container3D, CylinderPanel, GUI3DManager, HolographicButton, SpherePanel} from "@babylonjs/gui";
import {Rigplatform} from "../controllers/rigplatform";

export class Bmenu {
    private scene;
    constructor(scene: Scene, rig: Rigplatform) {
        const anchor = new TransformNode("bMenuAnchor");
        anchor.rotation.y = Angle.FromDegrees(180).radians();
        //anchor.position = rig.rigMesh.position;
        //anchor.rotation = new Vector3(0 , Angle.FromDegrees(180).radians(), 0);
        this.scene = scene;
        const manager = new GUI3DManager(scene);
        const panel = new CylinderPanel();
        panel.margin=.6;
        panel.scaling.y=.5;
        //panel.orientation = Container3D.FACEFORWARDREVERSED_ORIENTATION;
        panel.radius = 2;
        panel.columns = 8;
        manager.addControl(panel);
        panel.linkToTransformNode(anchor);
        panel.position.z = 2;
        panel.position.y = 4;
        for (var i = 0; i < 10; i++) {
            panel.addControl(this.makeButton("Button " + i));
        }



    }
    makeButton(name: string) {
        const button = new HolographicButton(name);
        button.text = name;
        return button;
    }
}
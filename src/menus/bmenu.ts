import {Angle, FadeInOutBehavior, Scene, TransformNode, Vector3, WebXRExperienceHelper} from "@babylonjs/core";
import {
    Container3D,
    CylinderPanel,
    GUI3DManager,
    HandMenu,
    HolographicButton, HolographicSlate,
    NearMenu, PlanePanel,
    SpherePanel
} from "@babylonjs/gui";
import {Rigplatform} from "../controllers/rigplatform";

export class Bmenu {
    private scene;
    private rig;
    private xr;
    private manager;
    private panel;
    constructor(scene: Scene, rig: Rigplatform, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.rig = rig;
        this.manager = new GUI3DManager(scene);
        this.xr = xr;
    }

    makeButton(name: string, id: string) {
        const button = new HolographicButton(name);
        button.text = name;
        button.name = id;
        button.onPointerClickObservable.add(this.#clickhandler, -1, false, this);
        return button;
    }
    #clickhandler(_info, state) {
        console.log(state.currentTarget.name);
    }
    toggle() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        } else {
            const anchor = new TransformNode("bMenuAnchor");
            anchor.rotation.y = Angle.FromDegrees(180).radians();
            const cam = this.xr.camera.getFrontPosition(2);
            anchor.position = cam;
            const panel = new PlanePanel();
            panel.margin=.6;
            //panel.scaling.y=.5;
            //panel.orientation = Container3D.FACEFORWARDREVERSED_ORIENTATION;

            panel.columns = 5;
            this.manager.addControl(panel);
            panel.linkToTransformNode(anchor);
            //panel.position.z = 2;
            //panel.position.y = 4;

            panel.addControl(this.makeButton("Add Box", "addBox"));
            panel.addControl(this.makeButton("Add Sphere", "addSphere"));
            panel.addControl(this.makeButton("Add Cylinder", "addCylinder"));
            this.panel = panel;
        }

    }
}
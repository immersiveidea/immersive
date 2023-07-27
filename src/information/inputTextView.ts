import {AbstractMesh, Angle, MeshBuilder, Scene, WebXRExperienceHelper} from "@babylonjs/core";
import {AdvancedDynamicTexture, InputText} from "@babylonjs/gui";

export class InputTextView {
    private mesh: AbstractMesh;
    private scene: Scene;
    private xr: WebXRExperienceHelper;
    private inputPlane: AbstractMesh;
    private inputText: InputText;
    constructor(scene: Scene, xr: WebXRExperienceHelper, mesh: AbstractMesh ) {
        this.scene = scene;
        this.xr = xr;
        this.mesh = mesh;
    }
    public async show(text: string) {
        this.inputPlane = MeshBuilder.CreatePlane("myPlane", {width: 1, height: .125}, this.scene);
        const pos = this.mesh.absolutePosition;
        pos.y += .2;
        this.inputPlane.position= pos;
        this.inputPlane.rotation.y = Angle.FromDegrees(180).radians();
        const textDisplayTexture = AdvancedDynamicTexture.CreateForMesh(this.inputPlane, 1024, 128);
        this.inputPlane.material.backFaceCulling = false;
        this.inputText = this.createInputText();
        this.inputText.text = text;
        textDisplayTexture.addControl(this.inputText);
    }
    private createInputText(): InputText {
        const inputText =  new InputText("input");
        inputText.color= "white";
        inputText.background = "black";
        inputText.height= "128px";
        inputText.width= "1024px";
        inputText.maxWidth= "1024px";
        inputText.margin="0px";
        inputText.fontSize= "48px";
        return inputText;
    }
    public async dispose() {
        this.inputPlane.dispose(false, true);
        this.inputPlane = null;
        this.inputText = null;
    }
    public async updateText(text: string) {
        this.inputText.text = text;
    }
}
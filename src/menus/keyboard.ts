import {AbstractMesh, MeshBuilder, Scene, Vector3, WebXRExperienceHelper} from "@babylonjs/core";
import {
    AdvancedDynamicTexture,
    Button3D,
    GUI3DManager, InputText, PlanePanel,
    StackPanel, StackPanel3D,
    TextBlock,
    TouchHolographicButton
} from "@babylonjs/gui";
import {MyMenu} from "../util/myMenu";

export class Keyboard {
    private manager: GUI3DManager;
    private readonly scene: Scene;
    private mesh: AbstractMesh;
    private panel: AbstractMesh;
    private xr: WebXRExperienceHelper;
    constructor(scene: Scene, xr: WebXRExperienceHelper, mesh: AbstractMesh ) {
        this.scene = scene;
        this.xr = xr;
        this.mesh = mesh;
    }
    public async show() {
        this.panel = MeshBuilder.CreatePlane("hudPlane", {width: 1, height: 1}, this.scene);
        const inputTexture = AdvancedDynamicTexture.CreateForMesh(this.panel, 1024, 1024);
        await inputTexture.parseFromURLAsync("./textInputTexture.json", false);

        this.panel.position = this.xr.camera.getFrontPosition(3);
        this.panel.position.y = this.panel.position.y + 2;
        this.panel.lookAt(this.xr.camera.getFrontPosition(-1));
        this.panel.rotation.y = this.panel.rotation.y + Math.PI;

    }

}
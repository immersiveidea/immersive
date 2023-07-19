import {AbstractMesh, Color3, MeshBuilder, Scene, Vector3} from "@babylonjs/core";
import {AdvancedDynamicTexture, StackPanel, TextBlock} from "@babylonjs/gui";
import {Controllers} from "../controllers/controllers";

export class Hud {
    private scene: Scene;
    private parent: AbstractMesh;
    private hudPlane: AbstractMesh;
    constructor(parent: AbstractMesh, scene: Scene) {
        this.scene = scene;
        this.parent = parent;
        this.hudPlane = MeshBuilder.CreatePlane("hudPlane", {width: 1, height: .5}, this.parent.getScene());
        this.hudPlane.parent=this.parent.getScene().activeCamera
        this.parent.getScene().onActiveCameraChanged.add((scene) => {
            this.hudPlane.parent = scene.activeCamera;
        });
        this.hudPlane.position = new Vector3(.5, .75, 3);

        this.hudPlane.outlineColor = Color3.FromHexString("#ffffff");


        const textPosition = this.createTextBlock();
        const textRotation = this.createTextBlock();

        const hudTexture = AdvancedDynamicTexture.CreateForMesh(this.hudPlane, 1024, 512);

        hudTexture.background = "black";
        const stackPanel = new StackPanel();
        hudTexture.addControl(stackPanel);


        stackPanel.addControl(textPosition);
        stackPanel.addControl(textRotation);

        this.scene.onBeforeRenderObservable.add(() => {
            if (Controllers.movable) {
                textPosition.text = 'position: '+ this.formatVector3(Controllers.movable.position);
                textRotation.text = 'rotation: '+ this.formatVector3(Controllers.movable.rotation);
            }
        });
    }
    createTextBlock(): TextBlock {
        const text = new TextBlock();
        text.isHitTestVisible = false;
        text.text = "";
        text.height="20%";
        text.resizeToFit=true;

        text.color="white";
        text.fontSize = 64;
        return text;
    }
    private formatVector3(v: Vector3): string {
        return `(${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)})`;
    }
}

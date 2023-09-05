import {MeshBuilder, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {AbstractMenu} from "./abstractMenu";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {AdvancedDynamicTexture, Button, Control, ScrollViewer, StackPanel, TextBlock} from "@babylonjs/gui";
import {setMenuPosition} from "../util/functions/setMenuPosition";

export class DiagramListingMenu extends AbstractMenu {
    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.buildMenu();
        this.controllers.controllerObserver.add((event) => {
            if (event.type == ControllerEventType.B_BUTTON) {
                this.toggle();
            }
        });
    }

    public toggle() {
        setMenuPosition(this.handle.mesh, this.scene, new Vector3(0, .4, 0));
    }

    private buildMenu() {
        const configPlane = MeshBuilder
            .CreatePlane("gridSizePlane",
                {
                    width: 1,
                    height: .5
                }, this.scene);
        const configTexture = AdvancedDynamicTexture.CreateForMesh(configPlane, 2048, 1024);

        configTexture.background = "white";
        const scrollViewer = new ScrollViewer('diagramListingScroll');
        configTexture.addControl(scrollViewer);
        const stackpanel = new StackPanel('diagramListingStack');
        scrollViewer.addControl(stackpanel);
        for (let i = 0; i < 100; i++) {
            const row = new StackPanel('diagramListingRow ' + i);
            row.isVertical = false;
            row.height = "68px";
            row.width = 1;
            stackpanel.addControl(row);
            const selectButton = Button.CreateSimpleButton('diagramListingText ' + i, 'Select');
            selectButton.height = "64px";
            selectButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            selectButton.width = "220px";
            selectButton.color = "white";
            selectButton.fontSize = "48px";
            selectButton.background = "#333333";
            selectButton.onPointerClickObservable.add(() => {

            });
            const textBlock = new TextBlock('diagramListingText ' + i, 'Diagram ' + i);
            textBlock.width = "1000px";
            textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            textBlock.fontSize = "48px";
            row.addControl(selectButton);
            row.addControl(textBlock);

        }
        this.createHandle(configPlane);
        configPlane.position.y = .5;
        setMenuPosition(this.handle.mesh, this.scene, new Vector3(0, .4, 0));

    }
}
import {AbstractMesh, MeshBuilder, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {AbstractMenu} from "./abstractMenu";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {AdvancedDynamicTexture, Button, Control, ScrollViewer, StackPanel, TextBlock} from "@babylonjs/gui";
import {setMenuPosition} from "../util/functions/setMenuPosition";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramListingEvent, DiagramListingEventType} from "../diagram/types/diagramListing";
import {DiagramEventType} from "../diagram/types/diagramEntity";


export class DiagramListingMenu extends AbstractMenu {
    private mesh: AbstractMesh;
    private panel: StackPanel;
    private readonly diagramManager: DiagramManager;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers, diagramManager: DiagramManager) {
        super(scene, xr, controllers);
        this.diagramManager = diagramManager;


        this.buildMenu();
        this.controllers.controllerObserver.add((event) => {
            if (event.type == ControllerEventType.B_BUTTON) {

                this.toggle();
            }
        });
    }

    public toggle() {
        setMenuPosition(this.handle.mesh, this.scene, new Vector3(0, .4, 0));
        this.mesh.isVisible = !this.mesh.isVisible;
        this.populateData();
        (this.mesh.parent as AbstractMesh).isVisible = this.mesh.isVisible;
    }

    public populateData() {
        this.panel.clearControls();
        this.diagramManager.onDiagramEventListingObservable.notifyObservers({type: DiagramListingEventType.GETALL}, -1);
    }

    private buildMenu() {
        const configPlane = MeshBuilder
            .CreatePlane("gridSizePlane",
                {
                    width: 1,
                    height: .5
                }, this.scene);
        this.mesh = configPlane;
        const configTexture = AdvancedDynamicTexture.CreateForMesh(configPlane, 2048, 1024);

        configTexture.background = "white";
        const scrollViewer = new ScrollViewer('diagramListingScroll');
        configTexture.addControl(scrollViewer);
        this.panel = new StackPanel('diagramListingStack');
        scrollViewer.addControl(this.panel);

        this.createHandle(configPlane);
        configPlane.position.y = .5;
        setMenuPosition(this.handle.mesh, this.scene, new Vector3(0, .4, 0));
        this.mesh.isVisible = false;
        (this.mesh.parent as AbstractMesh).isVisible = false;
        this.diagramManager.onDiagramEventListingObservable.add((event: DiagramListingEvent) => {
            if (event.type == DiagramListingEventType.ADD) {
                this.addRow(event.listing.id, event.listing.name);
            }
        }, -1, false, this);

    }

    private addRow(id: string, name: string) {
        const row = new StackPanel('diagramListingRow ' + id);
        row.isVertical = false;
        row.height = "68px";
        row.width = 1;
        this.panel.addControl(row);
        const selectButton = Button.CreateSimpleButton('diagramListingText ' + id, id);
        selectButton.height = "64px";
        selectButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        selectButton.width = "220px";
        selectButton.color = "white";
        selectButton.fontSize = "48px";
        selectButton.background = "#333333";
        selectButton.onPointerClickObservable.add(() => {
            this.diagramManager.onDiagramEventObservable.notifyObservers({type: DiagramEventType.RESET});
            console.log(id);
        }, -1, false, this);
        const textBlock = new TextBlock('diagramListingText ' + name, 'Diagram ' + name);
        textBlock.width = "1000px";
        textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.fontSize = "48px";
        row.addControl(selectButton);
        row.addControl(textBlock);
    }
}
import {AdvancedDynamicTexture, RadioGroup, SelectionPanel, StackPanel} from "@babylonjs/gui";
import {MeshBuilder, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {AppConfig} from "../util/appConfig";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {AbstractMenu} from "./abstractMenu";
import {setMenuPosition} from "../util/functions/setMenuPosition";

export class ConfigMenu extends AbstractMenu {
    private sounds: DiaSounds;

    private yObserver;
    private config: AppConfig;
    private gridSnaps: Array<{ label: string, value: number }> = [
        {label: "Off", value: 0},
        {label: "0.01", value: 0.01},
        {label: "0.1", value: 0.1},
        {label: "0.5", value: 0.5},
        {label: "1", value: 1},
    ]

    private rotationSnaps: Array<{ label: string, value: number }> = [
        {label: "Off", value: 0},
        {label: "22.5", value: 22.5},
        {label: "45", value: 45},
        {label: "90", value: 90},

    ]

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers, config: AppConfig) {
        super(scene, xr, controllers);
        this.config = config;
        this.sounds = new DiaSounds(scene);
        if (!this.yObserver) {
            this.controllers.controllerObserver.add((event) => {
                if (event.type == ControllerEventType.Y_BUTTON) {
                    this.toggle();
                }
            });
        }

    }



    public toggle() {
        if (this.handle) {
            this.handle.mesh.dispose(false, true);
            this.sounds.exit.play();
            this.handle = null;
            return;
        }
        this.sounds.enter.play();
        const configPlane = MeshBuilder
            .CreatePlane("gridSizePlane",
                {
                    width: .6,
                    height: .3
                }, this.scene);
        this.createHandle(configPlane);
        const configTexture = AdvancedDynamicTexture.CreateForMesh(configPlane, 2048, 1024);

        configTexture.background = "white";
        const columnPanel = new StackPanel('columns');
        columnPanel.fontSize = "48px";
        columnPanel.isVertical = false;
        configTexture.addControl(columnPanel);
        const selectionPanel1 = new SelectionPanel("selectionPanel1");
        selectionPanel1.width = .5;
        columnPanel.addControl(selectionPanel1);
        this.buildGridSizeControl(selectionPanel1);
        this.buildCreateScaleControl(selectionPanel1);
        const selectionPanel2 = new SelectionPanel("selectionPanel2");
        selectionPanel2.width = .5;
        columnPanel.addControl(selectionPanel2);
        this.buildRotationSnapControl(selectionPanel2);
        this.buildTurnSnapControl(selectionPanel2);
        configPlane.position.set(0, .2, 0);
        setMenuPosition(this.handle.mesh, this.scene, new Vector3(0, .4, 0));
    }

    private adjustRadio(radio: RadioGroup) {
        radio.groupPanel.height = "512px";
        radio.groupPanel.fontSize = "64px";
        radio.groupPanel.children[0].height = "70px";
        radio.groupPanel.paddingLeft = "16px";
        radio.selectors.forEach((panel) => {
            panel.children[0].height = "64px";
            panel.children[0].width = "64px";
            panel.children[1].paddingLeft = "32px";
            panel.paddingTop = "16px";
            panel.fontSize = "60px";
            panel.adaptHeightToChildren = true;
        });
    }

    private buildCreateScaleControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Create Scale");

        selectionPanel.addGroup(radio);
        for (const [index, snap] of this.gridSnaps.entries()) {
            const selected = (this.config.current.createSnap == snap.value);
            radio.addRadio(snap.label, this.createVal.bind(this), selected);
        }
        this.adjustRadio(radio);
        return radio;
    }

    private buildRotationSnapControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Rotation Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of this.rotationSnaps.entries()) {
            const selected = (this.config.current.rotateSnap == snap.value);
            radio.addRadio(snap.label, this.rotateVal.bind(this), selected);
        }
        this.adjustRadio(radio);
        return radio;
    }

    private buildGridSizeControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Grid Snap");

        selectionPanel.addGroup(radio);

        for (const [index, snap] of this.gridSnaps.entries()) {
            const selected = (this.config.current.gridSnap == snap.value);

            radio.addRadio(snap.label, this.gridVal.bind(this), selected);
        }
        this.adjustRadio(radio);
        return radio;
    }

    private buildTurnSnapControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Turn Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of this.rotationSnaps.entries()) {
            const selected = (this.config.current.turnSnap == snap.value);
            radio.addRadio(snap.label, this.turnVal.bind(this), selected);
        }
        this.adjustRadio(radio);
        return radio;
    }

    private createVal(value) {
        this.config.setCreateSnap(this.gridSnaps[value].value);
    }

    private rotateVal(value) {
        this.config.setRotateSnap(this.rotationSnaps[value].value);
    }

    private turnVal(value) {
        this.config.setTurnSnap(this.rotationSnaps[value].value);
    }

    private gridVal(value) {
        this.config.setGridSnap(this.gridSnaps[value].value);
    }

}
import {AdvancedDynamicTexture, CheckboxGroup, RadioGroup, SelectionPanel, StackPanel} from "@babylonjs/gui";
import {MeshBuilder, Scene, TransformNode, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {AppConfig} from "../util/appConfig";
import {Controllers} from "../controllers/controllers";
import {AbstractMenu} from "./abstractMenu";
import log from "loglevel";

const logger = log.getLogger('ConfigMenu');

export class ConfigMenu extends AbstractMenu {
    private config: AppConfig;
    private readonly baseTransform: TransformNode;
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
        this.baseTransform = new TransformNode("configMenuBase", scene);
        this.config = config;
        this.buildMenu();
    }
    private buildMenu() {
        const configPlane = MeshBuilder
            .CreatePlane("configMenuPlane",
                {
                    width: .6,
                    height: .3
                }, this.scene);
        configPlane.setParent(this.baseTransform);
        this.createHandle(this.baseTransform, new Vector3(1, 1.6, .5), new Vector3(Math.PI / 4, Math.PI / 4, 0));
        configPlane.position.y = .2;
        const configTexture = AdvancedDynamicTexture.CreateForMesh(configPlane, 2048, 1024);
        const columnPanel = new StackPanel('columns');
        columnPanel.isVertical = false;
        columnPanel.fontSize = "48px";
        configTexture.addControl(columnPanel);
        const selectionPanel1 = new SelectionPanel("selectionPanel1");
        selectionPanel1.width = "500px";

        columnPanel.addControl(selectionPanel1);
        this.buildGridSizeControl(selectionPanel1);
        this.buildCreateScaleControl(selectionPanel1);

        const selectionPanel2 = new SelectionPanel("selectionPanel2");
        selectionPanel2.width = "500px";

        columnPanel.addControl(selectionPanel2);
        this.buildRotationSnapControl(selectionPanel2);
        this.buildTurnSnapControl(selectionPanel2);

        const selectionPanel3 = new SelectionPanel("selectionPanel3");
        selectionPanel3.width = "768px";
        columnPanel.addControl(selectionPanel3);
        this.buildFlyModeControl(selectionPanel3);
        this.baseTransform.parent.setEnabled(true);
    }

    private adjustRadio(radio: RadioGroup | CheckboxGroup) {
        radio.groupPanel.height = "512px";
        radio.groupPanel.background = "#cccccc";
        radio.groupPanel.color = "#000000";
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
            logger.debug(selected);
            radio.addRadio(snap.label, this.createVal.bind(this), selected);
        }
        this.adjustRadio(radio);
        return radio;
    }

    private buildFlyModeControl(selectionPanel: SelectionPanel): CheckboxGroup {
        const checkbox = new CheckboxGroup("Fly Mode");
        selectionPanel.addGroup(checkbox);
        checkbox.addCheckbox("Fly", this.flyMode.bind(this), this.config.current.flyMode);
        this.adjustRadio(checkbox);
        return checkbox;
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

    private flyMode(value) {
        this.config.setFlyMode(value);
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
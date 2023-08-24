import {AdvancedDynamicTexture, RadioGroup, SelectionPanel} from "@babylonjs/gui";
import {AbstractMesh, MeshBuilder, Scene, WebXRDefaultExperience} from "@babylonjs/core";
import {AppConfig} from "../util/appConfig";
import {ControllerEventType, Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {AbstractMenu} from "./abstractMenu";
import {setMenuPosition} from "../util/functions/setMenuPosition";

export class ConfigMenu extends AbstractMenu {
    private sounds: DiaSounds;
    private configPlane: AbstractMesh = null;

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
        if (this.configPlane) {
            this.sounds.exit.play();
            this.configPlane.dispose();
            this.configPlane = null;
            return;
        }
        this.sounds.enter.play();
        const width = .25;
        const height = .75;
        const res = 256;
        const heightPixels = Math.round((height / width) * res);
        this.configPlane = MeshBuilder
            .CreatePlane("gridSizePlane",
                {
                    width: .25,
                    height: .75
                }, this.scene);
        const configTexture = AdvancedDynamicTexture.CreateForMesh(this.configPlane, res, heightPixels);
        configTexture.background = "white";
        const selectionPanel = new SelectionPanel("selectionPanel");
        configTexture.addControl(selectionPanel)
        this.buildGridSizeControl(selectionPanel);
        this.buildCreateScaleControl(selectionPanel);
        this.buildRotationSnapControl(selectionPanel);
        this.buildTurnSnapControl(selectionPanel);

        setMenuPosition(this.configPlane, this.scene);
    }

    private buildCreateScaleControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Create Scale");
        selectionPanel.addGroup(radio);

        for (const [index, snap] of this.gridSnaps.entries()) {
            const selected = (this.config.current.createSnap == snap.value);
            radio.addRadio(snap.label, this.createVal.bind(this), selected);
        }
        return radio;
    }

    private buildRotationSnapControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Rotation Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of this.rotationSnaps.entries()) {
            const selected = (this.config.current.rotateSnap == snap.value);
            radio.addRadio(snap.label, this.rotateVal.bind(this), selected);
        }
        return radio;
    }

    private buildGridSizeControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Grid Snap");

        selectionPanel.addGroup(radio);

        for (const [index, snap] of this.gridSnaps.entries()) {
            const selected = (this.config.current.gridSnap == snap.value);

            radio.addRadio(snap.label, this.gridVal.bind(this), selected);
        }
        return radio;
    }

    private buildTurnSnapControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Turn Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of this.rotationSnaps.entries()) {
            const selected = (this.config.current.turnSnap == snap.value);
            radio.addRadio(snap.label, this.turnVal.bind(this), selected);
        }
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
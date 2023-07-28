import {AdvancedDynamicTexture, RadioGroup, SelectionPanel} from "@babylonjs/gui";
import {AbstractMesh, Angle, MeshBuilder, Scene, WebXRExperienceHelper} from "@babylonjs/core";
import {CameraHelper} from "../util/cameraHelper";
import log from "loglevel";
import {AppConfig} from "../util/appConfig";
import {Controllers} from "../controllers/controllers";

export class ConfigMenu {
    private readonly scene: Scene;
    private readonly xr: WebXRExperienceHelper;
    private configPlane: AbstractMesh = null;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;
        Controllers.controllerObserver.add((event) => {
            if (event.type == 'x-button') {
                this.toggle();
            }
        });
    }

    public toggle() {
        if (this.configPlane) {
            this.configPlane.dispose();
            this.configPlane = null;
            return;
        }
        const width = .25;
        const height = .55;
        const res = 256;
        const heightPixels = Math.round((height / width) * res);
        this.configPlane = MeshBuilder
            .CreatePlane("gridSizePlane",
                {
                    width: .25,
                    height: .5
                }, this.scene);
        const configTexture = AdvancedDynamicTexture.CreateForMesh(this.configPlane, res, heightPixels);
        configTexture.background = "white";
        const selectionPanel = new SelectionPanel("selectionPanel");
        configTexture.addControl(selectionPanel)
        this.buildGridSizeControl(selectionPanel);
        this.buildRotationSnapControl(selectionPanel);
        this.buildCreateScaleControl(selectionPanel);

        this.configPlane.position = CameraHelper.getFrontPosition(2, this.scene);
        this.configPlane.rotation.y = Angle.FromDegrees(180).radians();
    }

    private createVal(value) {
        AppConfig.config.currentCreateSnapIndex = value;
        log.debug("configMenu", "create Snap", value);
    }

    private buildCreateScaleControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Create Scale");
        selectionPanel.addGroup(radio);

        for (const [index, snap] of AppConfig.config.createSnaps().entries()) {
            const selected = AppConfig.config.currentCreateSnapIndex == index;
            radio.addRadio(snap.label, this.createVal, selected);
        }
        return radio;
    }

    private buildRotationSnapControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Rotation Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of AppConfig.config.rotateSnaps().entries()) {
            const selected = AppConfig.config.currentRotateSnapIndex == index;
            radio.addRadio(snap.label, this.rotateVal, selected);
        }
        return radio;
    }

    private buildGridSizeControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Grid Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of AppConfig.config.gridSnaps().entries()) {
            const selected = AppConfig.config.currentGridSnapIndex == index;
            radio.addRadio(snap.label, this.gridVal, selected);
        }
        return radio;
    }

    private rotateVal(value) {
        AppConfig.config.currentRotateSnapIndex = value;
        log.debug("configMenu", "rotate Snap", value);
    }

    private gridVal(value) {
        AppConfig.config.currentGridSnapIndex = value;
        log.debug("configMenu", "grid Snap", value);
    }

}
import {AdvancedDynamicTexture, RadioGroup, SelectionPanel} from "@babylonjs/gui";
import {AbstractMesh, MeshBuilder, Scene, WebXRExperienceHelper} from "@babylonjs/core";
import {CameraHelper} from "../util/cameraHelper";
import log from "loglevel";
import {AppConfig} from "../util/appConfig";
import {Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {BaseMenu} from "./baseMenu";

export class ConfigMenu extends BaseMenu {
    private sounds: DiaSounds;
    private configPlane: AbstractMesh = null;

    private yObserver;

    constructor(scene: Scene, xr: WebXRExperienceHelper, controllers: Controllers) {
        super(scene, xr, controllers);
        this.sounds = new DiaSounds(scene);
        if (!this.yObserver) {
            this.controllers.controllerObserver.add((event) => {
                if (event.type == 'y-button') {
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

        CameraHelper.setMenuPosition(this.configPlane, this.scene);
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

    private buildTurnSnapControl(selectionPanel: SelectionPanel): RadioGroup {
        const radio = new RadioGroup("Turn Snap");
        selectionPanel.addGroup(radio);
        for (const [index, snap] of AppConfig.config.turnSnaps().entries()) {
            const selected = AppConfig.config.currentTurnSnapIndex == index;
            radio.addRadio(snap.label, this.turnVal, selected);
        }
        return radio;
    }

    private rotateVal(value) {
        AppConfig.config.currentRotateSnapIndex = value;
        log.debug("configMenu", "rotate Snap", value);
    }

    private turnVal(value) {
        AppConfig.config.currentTurnSnapIndex = value;
        log.debug("configMenu", "turn Snap", value);
    }

    private gridVal(value) {
        AppConfig.config.currentGridSnapIndex = value;
        log.debug("configMenu", "grid Snap", value);
    }

}
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
        this.configPlane = MeshBuilder
            .CreatePlane("gridSizePlane",
                {
                    width: .25,
                    height: .5
                }, this.scene);
        const configTexture = AdvancedDynamicTexture.CreateForMesh(this.configPlane, 256, 512);
        configTexture.background = "white";
        const selectionPanel = new SelectionPanel("selectionPanel");
        selectionPanel.fontSize = "24px";
        selectionPanel.height = "100%";
        configTexture.addControl(selectionPanel)
        const radio1 = new RadioGroup("Rotation Snap");
        radio1.addRadio("Off", this.rotateVal);
        radio1.addRadio("22.5 degrees", this.rotateVal);
        radio1.addRadio("45 degrees", this.rotateVal);
        radio1.addRadio("90 degrees", this.rotateVal);
        selectionPanel.addGroup(radio1);
        const radio2 = new RadioGroup("Grid Snap");
        radio2.addRadio("Off", this.gridVal);
        radio2.addRadio("1 cm", this.gridVal);
        radio2.addRadio("10 cm", this.gridVal);
        radio2.addRadio("25 cm", this.gridVal);
        selectionPanel.addGroup(radio1);
        selectionPanel.addGroup(radio2);
        this.configPlane.position = CameraHelper.getFrontPosition(2, this.scene);
        this.configPlane.rotation.y = Angle.FromDegrees(180).radians();
    }

    private rotateVal(value) {
        AppConfig.config.rotateSnap = AppConfig.config.rotateSnapArray[value];
        log.debug("configMenu", "rotate Snap", value);
    }

    private gridVal(value) {
        AppConfig.config.gridSnap = AppConfig.config.gridSnapArray[value];
        log.debug("configMenu", "grid Snap", value);
    }

}
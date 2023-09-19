import {Color3, MeshBuilder, Quaternion, Scene, Vector3, WebXRDefaultExperience} from "@babylonjs/core";
import {AbstractMenu} from "../menus/abstractMenu";
import {ControllerEvent, ControllerEventType, Controllers} from "../controllers/controllers";
import {GUI3DManager, PlanePanel} from "@babylonjs/gui";
import log, {Logger} from "loglevel";
import {Field} from "./field";
import {getFrontPosition} from "../util/functions/getFrontPosition";

enum SoccerMenuState {
    PLAY,
    PLAN,
    TRAIN,
    NONE

}

export class SoccerMenu extends AbstractMenu {
    private manager: GUI3DManager;
    private state: SoccerMenuState = SoccerMenuState.NONE;
    private readonly field: Field;
    private logger: Logger = log.getLogger('SoccerMenu')
    private startTime: number;
    private startPosition: Vector3;

    constructor(scene: Scene, xr: WebXRDefaultExperience, controllers: Controllers) {
        super(scene, xr, controllers);
        this.field = new Field(this.scene);
        this.manager = new GUI3DManager(this.scene);

        this.controllers.controllerObserver.add(this.controllerEventHandler, -1, false, this);
        this.buildMenu();
    }

    private controllerEventHandler(event: ControllerEvent) {
        switch (this.state) {
            case SoccerMenuState.PLAY:
                this.playControllerEventHandler(event);
                break;
            case SoccerMenuState.PLAN:
                break;
            case SoccerMenuState.TRAIN:
                break;
            case SoccerMenuState.NONE:
                break
        }

    }

    private playControllerEventHandler(event: ControllerEvent) {
        switch (event.type) {
            case ControllerEventType.TRIGGER:
                if (event.value > .8) {
                    if (!this.startTime) {
                        this.startTime = new Date().getTime();
                        this.startPosition = event.controller.pointer.position.clone();
                    }
                } else {
                    if (this.startTime) {
                        const endPosition = event.controller.pointer.position.clone();
                        if (this.startTime && this.startPosition) {
                            const duration = new Date().getTime() - this.startTime;

                            this.controllers.controllerObserver.notifyObservers({
                                type: ControllerEventType.MOTION,
                                startPosition: this.startPosition,
                                endPosition: endPosition,
                                duration: duration
                            });
                            this.startTime = null;
                            this.startPosition = null;
                        }
                    }
                }
                const worldRay = this.scene.activeCamera.getForwardRay();
                worldRay.origin = this.scene.activeCamera.globalPosition;
                const pickInfo = this.scene.pickWithRay(worldRay, null);
                if (pickInfo?.hit) {
                    const circle = MeshBuilder.CreateSphere("circle", {diameter: .04}, this.scene);
                    circle.position = pickInfo.pickedPoint;
                    setTimeout(() => {
                        circle.dispose();
                    }, 1500);

                    if (pickInfo?.pickedMesh?.name == 'Football Ball.001') {
                        this.controllers.controllerObserver.notifyObservers({
                            type: ControllerEventType.GAZEPOINT,
                            endPosition: pickInfo.pickedPoint,
                            startPosition: this.xr.baseExperience.camera.globalPosition
                        })
                    }
                }
                const mesh = this.scene.getPointerOverMesh();
                if (mesh) {
                    const meta = mesh?.parent?.parent?.parent
                    if (meta) {
                        console.log(meta.id);
                    }
                }
                break;
            case ControllerEventType.MOTION:
                const start = event.startPosition.clone();
                const direction = start.subtract(event.endPosition);
                const force = direction.length() * 10;
                const dir = direction.normalize();
                const e = this.xr.baseExperience.camera.absoluteRotation.toEulerAngles();
                direction.applyRotationQuaternionInPlace(Quaternion.FromEulerAngles(0, e.y, 0));

                this.buildKickLine(dir, force);
                this.field.ball.kick(dir, force);
                break;
            case ControllerEventType.GAZEPOINT:
                if (event.endPosition) {
                    this.field.gazePoint = event.endPosition.clone();
                }
                break;
        }
    }

    private buildKickLine(direction: Vector3, force: number) {
        const start = this.field.ball.position.clone();
        const line = MeshBuilder.CreateLines("kickLine", {points: [start, start.add(direction.scale(force))]}, this.scene);
        line.color = new Color3(1, 1, .5);
        line.isPickable = false;
        setTimeout(() => {
            line.dispose();
        }, 2000);

    }

    makeButton(name: string, id: string) {
        const button = super.makeButton(name, id);
        button.onPointerClickObservable.add(this.handleClick, -1, false, this);
        return button;
    }

    private buildMenu() {
        const panel = new PlanePanel();
        panel.columns = 4;
        this.manager.addControl(panel);
        panel.addControl(this.makeButton("Play", "play"));
        panel.addControl(this.makeButton("Plan", "plan"));
        panel.addControl(this.makeButton("Train", "Train"));
        panel.addControl(this.makeButton("Modify", "modify"));
        this.manager.rootContainer.children[0].node.position.y = .2;
        this.manager.controlScaling = .2;
        this.createHandle(this.manager.rootContainer.children[0].node);
        this.handle.mesh.position = getFrontPosition(3, this.scene).add(new Vector3(0, .5, 0));
    }

    private handleClick(_info, state) {
        this.logger.debug("clicked " + state.currentTarget.name);
        switch (state.currentTarget.name) {
            case "play":
                this.state = SoccerMenuState.PLAY;
                break;
            case "plan":
                this.state = SoccerMenuState.PLAN;
                break;
            case "train":
                this.state = SoccerMenuState.TRAIN;
                break;
        }

    }

}
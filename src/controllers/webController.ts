import {AbstractMesh, MeshBuilder, Scene, Vector3} from "@babylonjs/core";
import {Rigplatform} from "./rigplatform";
import {ControllerEventType, Controllers} from "./controllers";
import {DiagramManager} from "../diagram/diagramManager";
import {GridMaterial} from "@babylonjs/materials";
import {setMenuPosition} from "../util/functions/setMenuPosition";
import {wheelHandler} from "./functions/wheelHandler";
import log, {Logger} from "loglevel";
import {isDiagramEntity} from "../diagram/functions/isDiagramEntity";

export class WebController {
    private readonly scene: Scene;
    private readonly logger: Logger = log.getLogger('WebController');
    private speed: number = 1;
    private readonly referencePlane: AbstractMesh;
    private pickedMesh: AbstractMesh;
    private rig: Rigplatform;
    private diagramManager: DiagramManager;
    private mouseDown: boolean = false;
    private readonly controllers: Controllers;
    private upDownWheel: boolean = false;
    private fowardBackWheel: boolean = false;

    constructor(scene: Scene, rig: Rigplatform, diagramManager: DiagramManager, controllers: Controllers) {
        this.scene = scene;
        this.rig = rig;
        this.diagramManager = diagramManager;
        this.controllers = controllers;

        this.referencePlane = MeshBuilder.CreatePlane('referencePlane', {size: 10}, this.scene);
        this.referencePlane.setEnabled(false);
        this.referencePlane.visibility = 0.5;
        const material = new GridMaterial('grid', this.scene);
        material.gridRatio = 1;
        material.backFaceCulling = false;
        material.antialias = true;
        this.referencePlane.material = material;


        this.scene.onKeyboardObservable.add((kbInfo) => {
            this.logger.debug(kbInfo);
            if (kbInfo.type == 1) {
                switch (kbInfo.event.key) {
                    case "ArrowUp":
                        this.rig.forwardback(-this.speed);
                        break;
                    case "ArrowDown":
                        this.rig.forwardback(this.speed);
                        break;
                    case "ArrowLeft":
                        this.rig.leftright(-this.speed);
                        break;
                    case "ArrowRight":
                        this.rig.leftright(this.speed);
                        break;
                    case "]":
                        this.speed *= 1.5;
                        break;
                    case "[":
                        this.speed *= .5;
                        break;
                    case " ":
                        if (kbInfo.event.ctrlKey) {
                            if (this.controllers) {
                                this.controllers.controllerObserver.notifyObservers(
                                    {type: ControllerEventType.X_BUTTON, value: 1}
                                )
                            }
                        }
                        break;
                    default:
                        this.logger.debug(kbInfo.event);
                }

            } else {
                this.rig.leftright(0);
                this.rig.forwardback(0);
            }
            if (kbInfo.event.key == "Shift") {
                if (kbInfo.type == 1) {
                    //this.referencePlane.setEnabled(true);
                } else {
                    this.referencePlane.setEnabled(false);
                    if (this.pickedMesh) {
                        this.pickedMesh.showBoundingBox = false;
                        this.pickedMesh = null;
                    }
                }
            }
        });

        this.scene.onPointerUp = () => {
            this.mouseDown = false;
            this.rig.turn(0);
        };


        window.addEventListener('wheel', (evt) => {
            switch (evt.buttons) {
                case 0:
                    if (this.fowardBackWheel == false) {
                        this.fowardBackWheel = true;
                        const reset = wheelHandler.bind(this);
                        setTimeout(reset, 500);
                    }
                    if (Math.sign(evt.deltaY) != 0) {
                        this.rig.forwardback(evt.deltaY / 100);
                    }
                    break;
                case 1:
                    if (this.upDownWheel == false) {
                        this.upDownWheel = true;
                        const reset = wheelHandler.bind(this);
                        setTimeout(reset, 500);
                    }
                    if (Math.sign(evt.deltaY) != 0) {
                        this.rig.updown(evt.deltaY / 100);
                    }

                    break;

            }


        });
        this.scene.onPointerDown = (evt, state) => {
            if (evt.pointerType == "mouse") {
                if (evt.shiftKey) {
                    setMenuPosition(this.referencePlane, this.scene, new Vector3(0, 0, 5));
                    //this.referencePlane.rotation = scene.activeCamera.absoluteRotation.toEulerAngles();
                    this.pickedMesh = state.pickedMesh.clone('pickedMesh', null, true);
                    this.pickedMesh.rotation = scene.activeCamera.absoluteRotation.toEulerAngles();
                    this.referencePlane.setEnabled(true);
                } else {
                    this.mouseDown = true;
                }
            }
        };
        this.scene.onPointerMove = (evt) => {
            if (this.mouseDown) {
                this.rig.turn(evt.movementX);
            }
            const meshPickInfo = scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
                return isDiagramEntity(mesh);
            });
            const planePickInfo = scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
                return mesh.id == this.referencePlane.id;
            });

            if (meshPickInfo.hit) {
                if (!this._mesh) {
                    this.mesh = meshPickInfo.pickedMesh;
                } else {
                    if (this._mesh.id != meshPickInfo.pickedMesh.id) {
                        this.mesh = meshPickInfo.pickedMesh;
                    }
                }
            } else {
                this.mesh = null;
            }
            if (this.pickedMesh && planePickInfo.hit) {
                this.pickedMesh.position = planePickInfo.pickedPoint;
            }
        }
    }

    _mesh: AbstractMesh;

    get mesh(): AbstractMesh {
        return this._mesh;
    }

    set mesh(mesh: AbstractMesh) {
        if (mesh) {
            mesh.showBoundingBox = true;
            mesh.outlineWidth = 0.08;
        } else {
            if (this._mesh) {
                this._mesh.showBoundingBox = false;
            }
        }
        this._mesh = mesh;
    }
}
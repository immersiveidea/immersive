import {AbstractMesh, KeyboardEventTypes, Scene} from "@babylonjs/core";
import {Rigplatform} from "./rigplatform";

import {DiagramManager} from "../diagram/diagramManager";
import {wheelHandler} from "./functions/wheelHandler";
import log, {Logger} from "loglevel";
import {DiagramEntityType, DiagramEventType, DiagramTemplates} from "../diagram/types/diagramEntity";
import {DiagramEventObserverMask} from "../diagram/types/diagramEventObserverMask";
import {getToolboxColors} from "../toolbox/toolbox";

export class WebController {
    private readonly scene: Scene;
    private readonly logger: Logger = log.getLogger('WebController');
    private speed: number = 1;
    private rig: Rigplatform;
    private diagramManager: DiagramManager;
    private mouseDown: boolean = false;

    private upDownWheel: boolean = false;
    private fowardBackWheel: boolean = false;
    private canvas: HTMLCanvasElement;

    constructor(scene: Scene,
                rig: Rigplatform,
                diagramManager: DiagramManager,
    ) {
        this.scene = scene;
        this.rig = rig;
        this.diagramManager = diagramManager;

        this.canvas = document.querySelector('#gameCanvas');
        //this.referencePlane = MeshBuilder.CreatePlane('referencePlane', {size: 10}, this.scene);
        //this.referencePlane.setEnabled(false);
        //this.referencePlane.visibility = 0.5;
        /*const material = new GridMaterial('grid', this.scene);
        material.gridRatio = 1;
        material.backFaceCulling = false;
        material.antialias = true;
        this.referencePlane.material = material;
*/

        this.scene.onKeyboardObservable.add((kbInfo) => {
            this.logger.debug(kbInfo);


            if (this.canvas && kbInfo.event.target != this.canvas) {
                return;
            }
            if (kbInfo.type == KeyboardEventTypes.KEYUP) {
                this.rig.turn(0);
                this.rig.updown(0);
            }
            if (kbInfo.type == 1) {
                switch (kbInfo.event.key) {
                    case "W":
                        this.rig.updown(-this.speed);
                        break;
                    case "S":
                        this.rig.updown(this.speed);
                        break;
                    case "ArrowUp":
                    case "w":
                        this.rig.forwardback(-this.speed);
                        break;
                    case "ArrowDown":
                    case "s":
                        this.rig.forwardback(this.speed);
                        break;
                    case "ArrowLeft":
                    case "a":
                        this.rig.leftright(-this.speed);
                        break;
                    case "A":
                        this.rig.turn(-this.speed);
                        break;
                    case "ArrowRight":
                    case "d":
                        this.rig.leftright(this.speed);
                        break;
                    case "D":
                        this.rig.turn(this.speed);
                        break;
                    case "]":
                        this.speed *= 1.5;
                        break;
                    case "[":
                        this.speed *= .5;
                        break;
                    case " ":
                        /*if (kbInfo.event.ctrlKey) {
                            if (this.controllers) {
                                this.controllers.controllerObservable.notifyObservers(
                                    {type: ControllerEventType.X_BUTTON, value: 1}
                                )
                            }
                        }

                         */
                        break;
                    case "T":
                        // Ctrl+Shift+T: Create test entities (sphere and box)
                        if (kbInfo.event.ctrlKey && kbInfo.event.shiftKey) {
                            this.createTestEntities();
                        }
                        break;
                    case "X":
                        // Ctrl+Shift+X: Clear all entities from diagram
                        if (kbInfo.event.ctrlKey && kbInfo.event.shiftKey) {
                            this.clearAllEntities();
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
                    /* this.referencePlane.setEnabled(false);
                     if (this.pickedMesh) {
                         this.pickedMesh.showBoundingBox = false;
                         this.pickedMesh = null;
                     }

                     */
                }
            }
        });

        this.scene.onPointerUp = () => {
            this.mouseDown = false;
            this.rig.turn(0);
            /*if (this.pickedMesh) {
                this.referencePlane.setEnabled(false);
                this.pickedMesh.showBoundingBox = false;
                this.pickedMesh = null;
            }*/
        };


        window.addEventListener('wheel', (evt) => {
            if (this.canvas && evt.target != this.canvas) {
                return;
            }
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
        this.scene.onPointerDown = (evt) => {
            if (evt.pointerType == "mouse") {
                this.mouseDown = true;
                /*if (evt.shiftKey) {
                    //setMenuPosition(this.referencePlane, this.scene, new Vector3(0, 0, 5));
                    //this.referencePlane.rotation = scene.activeCamera.absoluteRotation.toEulerAngles();
                    this.pickedMesh = state.pickedMesh;
                    if (this.pickedMesh) {
                        this.referencePlane.position = this.pickedMesh.position;
                        this.referencePlane.rotation = scene.activeCamera.absoluteRotation.toEulerAngles();
                    }
                    this.pickedMesh.rotation = scene.activeCamera.absoluteRotation.toEulerAngles();
                    this.referencePlane.setEnabled(true);
                } else {


                    if (state.pickedMesh) {

                        new ClickMenu(state.pickedMesh, state.gripTransform, this.diagramManager.onDiagramEventObservable);
                    }


                } */
            }
        };
        this.scene.onPointerMove = (evt) => {
            if (evt.pointerType != "mouse") {
                return;
            }
            if (this.mouseDown) {
                this.rig.turn(evt.movementX);
            }
            /*const meshPickInfo = scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
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
                if (this.mesh) {
                    this.diagramManager.onDiagramEventObservable.notifyObservers({
                        type: DiagramEventType.MODIFY,
                        entity: toDiagramEntity(this.mesh)
                    }, DiagramEventObserverMask.ALL);
                }
                this.mesh = null;
            }
            if (this.pickedMesh && planePickInfo.hit) {
                this.pickedMesh.position = planePickInfo.pickedPoint;
            }
            */
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

    /**
     * Create test entities for testing ResizeGizmo
     * Creates a sphere at (-0.25, 1.5, 4) and a box at (0.25, 1.5, 4)
     */
    private createTestEntities(): void {
        this.logger.info('Creating test entities (Ctrl+Shift+T)');

        // Get first color from toolbox colors array
        const firstColor = getToolboxColors()[0];
        const colorHex = firstColor.replace('#', '');

        // Create sphere
        this.diagramManager.onDiagramEventObservable.notifyObservers({
            type: DiagramEventType.ADD,
            entity: {
                id: `test-sphere-${colorHex}`,
                type: DiagramEntityType.ENTITY,
                template: DiagramTemplates.SPHERE,
                position: { x: -0.25, y: 1.5, z: 4 },
                scale: { x: 0.1, y: 0.1, z: 0.1 },
                color: firstColor
            }
        }, DiagramEventObserverMask.ALL);

        // Create box
        this.diagramManager.onDiagramEventObservable.notifyObservers({
            type: DiagramEventType.ADD,
            entity: {
                id: `test-box-${colorHex}`,
                type: DiagramEntityType.ENTITY,
                template: DiagramTemplates.BOX,
                position: { x: 0.25, y: 1.5, z: 4 },
                scale: { x: 0.1, y: 0.1, z: 0.1 },
                color: firstColor
            }
        }, DiagramEventObserverMask.ALL);

        this.logger.info(`Test entities created with color ${firstColor}: test-sphere-${colorHex} at (-0.25, 1.5, 4) and test-box-${colorHex} at (0.25, 1.5, 4)`);
    }

    /**
     * Clear all entities from the diagram
     */
    private clearAllEntities(): void {
        this.logger.info('Clearing all entities from diagram (Ctrl+Shift+X)');

        this.diagramManager.onDiagramEventObservable.notifyObservers({
            type: DiagramEventType.CLEAR
        }, DiagramEventObserverMask.TO_DB);

        this.logger.info('All entities cleared from diagram');
    }
}
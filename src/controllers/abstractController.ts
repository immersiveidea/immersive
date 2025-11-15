import {
    AbstractMesh,
    Ray,
    Scene,
    Vector3,
    WebXRControllerComponent,
    WebXRDefaultExperience,
    WebXRInputSource
} from "@babylonjs/core";
import {DiagramManager} from "../diagram/diagramManager";
import log from "loglevel";

import {grabAndClone} from "./functions/grabAndClone";
import {ClickMenu} from "../menus/clickMenu";
import {motionControllerInitObserver} from "./functions/motionControllerInitObserver";
import {DefaultScene} from "../defaultScene";

import {DiagramObject} from "../diagram/diagramObject";
import {MeshTypeEnum} from "../diagram/types/meshTypeEnum";
import {getMeshType} from "./functions/getMeshType";
import {viewOnly} from "../util/functions/getPath";

import {ControllerEventType} from "./types/controllerEventType";
import {controllerObservable} from "./controllers";
import {grabMesh} from "../diagram/functions/grabMesh";
import {dropMesh} from "../diagram/functions/dropMesh";

const CLICK_TIME = 300;


export abstract class AbstractController {
    static stickVector = Vector3.Zero();
    protected readonly scene: Scene;
    protected readonly xr: WebXRDefaultExperience;
    protected readonly diagramManager: DiagramManager;
    protected xrInputSource: WebXRInputSource;
    protected speedFactor = 4;

    protected grabbedObject: DiagramObject = null;
    protected grabbedMesh: AbstractMesh = null;
    protected grabbedMeshType: MeshTypeEnum = null;


    private readonly _logger = log.getLogger('AbstractController');
    private _clickStart: number = 0;
    private _clickMenu: ClickMenu;
    private _pickPoint: Vector3 = new Vector3();
    private _meshUnderPointer: AbstractMesh;


    // Gizmo control state for squeeze button interaction
    private _activeGizmoAxis: any = null; // IAxisScaleGizmo type from BabylonJS
    private _draggingGizmo: boolean = false;


    constructor(controller: WebXRInputSource,
                xr: WebXRDefaultExperience,
                diagramManager: DiagramManager) {
        this._logger.debug('Base Controller Constructor called');
        this.xrInputSource = controller;
        this.scene = DefaultScene.Scene;
        this.xr = xr;

        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo?.pickInfo?.gripTransform?.id == this.xrInputSource?.grip?.id) {
                if (pointerInfo.pickInfo.pickedMesh) {
                    // Filter out utility layer meshes (secondary defense against event leak-through)
                    const resizeGizmo = this.diagramManager?.diagramMenuManager?.resizeGizmo;
                    if (resizeGizmo) {
                        const utilityScene = resizeGizmo.getUtilityScene();
                        if (pointerInfo.pickInfo.pickedMesh.getScene() === utilityScene) {
                            // This is a gizmo handle, ignore it in main scene pointer handling
                            this._meshUnderPointer = null;
                            return;
                        }

                        // Don't set _meshUnderPointer if ResizeGizmo is active
                        // Prevents main scene mesh grab from conflicting with handle interaction
                        if (resizeGizmo.isHoveringHandle() || resizeGizmo.isScaling()) {
                            this._meshUnderPointer = null;
                            return;
                        }
                    }

                    this._pickPoint.copyFrom(pointerInfo.pickInfo.pickedPoint);
                    this._meshUnderPointer = pointerInfo.pickInfo.pickedMesh;

                    // Auto-show resize gizmo when hovering diagram object
                    if (this.diagramManager?.isDiagramObject(this._meshUnderPointer)) {
                        this.diagramManager.diagramMenuManager.handleDiagramObjectHover(
                            this._meshUnderPointer,
                            pointerInfo.pickInfo.pickedPoint
                        );
                    } else {
                        // Hovering non-diagram object, pass pointer position to check if still in bounds
                        this.diagramManager.diagramMenuManager.handleDiagramObjectHover(
                            null,
                            pointerInfo.pickInfo.pickedPoint
                        );
                    }
                } else {
                    this._meshUnderPointer = null;
                    // No mesh under pointer, use controller pointer position
                    const pointerPos = this.xrInputSource?.pointer?.position;
                    this.diagramManager?.diagramMenuManager.handleDiagramObjectHover(null, pointerPos);
                }
            }
        });
        this.diagramManager = diagramManager;

        //@TODO THis works, but it uses initGrip, not sure if this is the best idea
        this.xrInputSource.onMotionControllerInitObservable.add(motionControllerInitObserver, -1, false, this);
        controllerObservable.add((event) => {
            this._logger.debug(event);
            switch (event.type) {
                case ControllerEventType.PULSE:
                    if (event.gripId == this?.xrInputSource?.grip?.id) {
                        this.xrInputSource?.motionController?.pulse(.35, 50)
                            .then(() => {
                                this._logger.debug("pulse done");
                            });
                    }
                    break;
                case ControllerEventType.HIDE:
                    this.disable();
                    break;
                case ControllerEventType.SHOW:
                    this.enable();
                    break;
            }
        });
    }

    public disable() {
        this.scene.preventDefaultOnPointerDown = true;
        this.xrInputSource.motionController.rootMesh.setEnabled(false)
        this.xrInputSource.pointer.setEnabled(false);
    }

    public enable() {
        this.scene.preventDefaultOnPointerDown = false;
        this.xrInputSource.motionController.rootMesh.setEnabled(true);
        this.xrInputSource.pointer.setEnabled(true)
    }

    protected initClicker(trigger: WebXRControllerComponent) {
        this._logger.debug("initTrigger");
        trigger.onButtonStateChangedObservable.add(() => {
            if (viewOnly()) {
                return;
            }
            if (trigger.changes.pressed) {
                if (trigger.pressed) {
                    if (this.diagramManager.diagramMenuManager.scaleMenu.mesh == this._meshUnderPointer) {
                        return;
                    }

                    if (this._clickStart == 0) {
                        this._clickStart = Date.now();
                        window.setTimeout(() => {
                            if (this._clickStart > 0) {
                                this._logger.debug("grabbing and cloning");
                                const clone = grabAndClone(this.diagramManager, this._meshUnderPointer, this.xrInputSource.motionController.rootMesh);

                                this.grabbedObject = clone;
                                this.grabbedMesh = clone.mesh;
                                this.grabbedMeshType = getMeshType(clone.mesh, this.diagramManager);
                                this._meshUnderPointer = clone.mesh;
                                clone.grabbed = true;
                            }
                        }, 300, this);
                    }
                } else {
                    const clickEnd = Date.now();
                    if (this._clickStart > 0 && (clickEnd - this._clickStart) < CLICK_TIME) {
                        this.click();
                    } else {
                        if (this.grabbedObject || this.grabbedMesh) {
                            this.drop();
                        }
                    }
                    this._clickStart = 0;
                }
            }
        }, -1, false, this);
    }

    protected notifyObserver(value: number, controllerEventType: ControllerEventType): number {
        if (Math.abs(value) > .1) {
            controllerObservable.notifyObservers({
                type: controllerEventType,
                value: value * this.speedFactor
            });
            return 1;
        } else {
            return 0;
        }
    }

    protected initButton(button: WebXRControllerComponent, type: ControllerEventType) {
        if (button) {
            button.onButtonStateChangedObservable.add((value) => {
                if (value.pressed) {
                    this._logger.debug(button.type, button.id, 'pressed');
                    controllerObservable.notifyObservers({type: type});
                }
            });
        }
    }

    private click() {
        let mesh = this.xr.pointerSelection.getMeshUnderPointer(this.xrInputSource.uniqueId);

        // Filter out utility layer meshes (tertiary defense against event leak-through)
        if (mesh) {
            const resizeGizmo = this.diagramManager?.diagramMenuManager?.resizeGizmo;
            if (resizeGizmo) {
                const utilityScene = resizeGizmo.getUtilityScene();
                if (mesh.getScene() === utilityScene) {
                    // This is a gizmo handle, ignore click
                    this._logger.debug("click on utility layer mesh (gizmo), ignoring");
                    return;
                }
            }
        }

        if (this.diagramManager.isDiagramObject(mesh)) {
            this._logger.debug("click on " + mesh.id);
            if (this.diagramManager.diagramMenuManager.connectionPreview) {
                this.diagramManager.diagramMenuManager.connect(mesh);

            } else {
                if (this._clickMenu) {
                    this._clickMenu.dispose();
                }
                this._clickMenu = this.diagramManager.diagramMenuManager.createClickMenu(mesh, this.xrInputSource);
            }
        } else {
            this._logger.debug("click on nothing");
        }
    }

    private initGrip(grip: WebXRControllerComponent) {
        grip.onButtonStateChangedObservable.add(() => {
            if (grip.changes.pressed) {
                if (grip.pressed) {
                    this._logger.debug("=== SQUEEZE PRESSED ===");

                    // Check if ResizeGizmo will handle the grip (hovering a handle)
                    const resizeGizmo = this.diagramManager.diagramMenuManager.resizeGizmo;
                    if (resizeGizmo.isHoveringHandle()) {
                        // ResizeGizmo will handle grip on its handle, don't interfere
                        this._logger.debug("ResizeGizmo hovering handle, letting it handle grip");
                        return;
                    }

                    // Check if hovering over old gizmo axis (ScaleMenu2)
                    const gizmoAxis = this.getGizmoAxisUnderPointer();
                    this._logger.debug(`Gizmo axis detected: ${gizmoAxis ? gizmoAxis._rootMesh?.id : 'null'}`);
                    if (gizmoAxis) {
                        // Squeeze on gizmo = start scaling
                        this._logger.debug("Starting gizmo drag");
                        this.startGizmoDrag(gizmoAxis);
                    } else {
                        // Squeeze on object = grab it
                        // ResizeGizmo is not hovering a handle, so safe to grab
                        this._logger.debug("Starting normal grab");
                        this.grab();
                    }
                } else {
                    this._logger.debug("=== SQUEEZE RELEASED ===");

                    // Check if ResizeGizmo was scaling
                    const resizeGizmo = this.diagramManager.diagramMenuManager.resizeGizmo;
                    if (resizeGizmo.isScaling()) {
                        // ResizeGizmo will handle release internally, don't interfere
                        return;
                    }

                    // Release squeeze
                    if (this._draggingGizmo) {
                        // Was dragging gizmo, end it
                        this._logger.debug("Ending gizmo drag");
                        this.endGizmoDrag();
                    } else {
                        // Was grabbing object, drop it
                        this._logger.debug("Dropping object");
                        this.drop();
                    }
                }
            }
        });
    }

    private grab() {
        if (viewOnly() || this._meshUnderPointer == null) {
            return;
        }

        // Defense in depth: Verify ResizeGizmo isn't active
        // Prevents race conditions where grip press happens during state transitions
        const resizeGizmo = this.diagramManager?.diagramMenuManager?.resizeGizmo;
        if (resizeGizmo && (resizeGizmo.isHoveringHandle() || resizeGizmo.isScaling())) {
            this._logger.debug("ResizeGizmo is active, aborting grab");
            return;
        }

        const {
            grabbedMesh,
            grabbedObject,
            grabbedMeshType
        } = grabMesh(this._meshUnderPointer, this.diagramManager, this.xrInputSource.motionController.rootMesh);
        this.grabbedMesh = grabbedMesh;
        this.grabbedObject = grabbedObject;
        this.grabbedMeshType = grabbedMeshType;
    }

    private drop() {
        const dropped = dropMesh(this.grabbedMesh, this.grabbedObject, this._pickPoint, this.grabbedMeshType, this.diagramManager);
        if (dropped) {
            this.grabbedMesh = null;
            this.grabbedObject = null;
            this.grabbedMeshType = null;
        }
    }

    /**
     * Check if the pointer is currently over a gizmo axis and return it
     * Uses direct ray picking from the utility layer because gizmo meshes
     * are on utility layer, not included in _meshUnderPointer
     * @returns The gizmo axis under the pointer, or null
     */
    private getGizmoAxisUnderPointer(): any | null {
        this._logger.debug("--- getGizmoAxisUnderPointer called ---");

        const scaleMenu = this.diagramManager.diagramMenuManager.scaleMenu;
        if (!scaleMenu || !scaleMenu.gizmoManager) {
            this._logger.debug("No scale menu or gizmo manager");
            return null;
        }

        const gizmo = scaleMenu.gizmoManager.gizmos.scaleGizmo;
        if (!gizmo) {
            this._logger.debug("No scale gizmo");
            return null;
        }

        this._logger.debug(`Gizmo attached mesh: ${scaleMenu.gizmoManager.attachedMesh?.id}`);

        // Get the utility layer that contains the gizmo meshes
        const utilityLayer = gizmo.xGizmo?._rootMesh?.getScene();
        if (!utilityLayer) {
            this._logger.debug("No utility layer found");
            return null;
        }

        this._logger.debug(`Utility layer found: ${utilityLayer.constructor.name}`);

        // Use controller's pointer ray directly to pick gizmo meshes
        const pointerRay = this.xrInputSource.pointer.forward;
        const pointerOrigin = this.xrInputSource.pointer.position;

        this._logger.debug(`Pointer origin: ${pointerOrigin}, direction: ${pointerRay}`);

        const ray = new Ray(pointerOrigin, pointerRay, 1000);

        // Pick from the utility layer scene, not the main scene
        // Don't filter in predicate - let all meshes be pickable, then check hierarchy after
        const pickResult = utilityLayer.pickWithRay(ray);

        this._logger.debug(`Pick result: hit=${pickResult?.hit}, pickedMesh=${pickResult?.pickedMesh?.id}`);

        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
            this._logger.debug(`Checking if picked mesh ${pickResult.pickedMesh.id} is part of gizmo`);

            // Determine which axis was picked by checking hierarchy
            if (this.isMeshInGizmoHierarchy(pickResult.pickedMesh, gizmo.xGizmo)) {
                this._logger.debug("Detected X axis");
                return gizmo.xGizmo;
            }
            if (this.isMeshInGizmoHierarchy(pickResult.pickedMesh, gizmo.yGizmo)) {
                this._logger.debug("Detected Y axis");
                return gizmo.yGizmo;
            }
            if (this.isMeshInGizmoHierarchy(pickResult.pickedMesh, gizmo.zGizmo)) {
                this._logger.debug("Detected Z axis");
                return gizmo.zGizmo;
            }

            this._logger.debug(`Picked mesh ${pickResult.pickedMesh.id} is not part of any gizmo axis`);
        }

        this._logger.debug("No gizmo axis found");
        return null;
    }

    /**
     * Check if a mesh is part of a gizmo's hierarchy
     */
    private isMeshInGizmoHierarchy(mesh: AbstractMesh, gizmo: any): boolean {
        if (!gizmo || !gizmo._rootMesh) {
            this._logger.debug(`isMeshInGizmoHierarchy: no gizmo or rootMesh`);
            return false;
        }

        this._logger.debug(`Checking if ${mesh.id} is in gizmo ${gizmo._rootMesh.id} hierarchy`);

        // Check if mesh matches gizmo root or is a child
        let current: any = mesh;
        let depth = 0;
        while (current && depth < 10) {
            this._logger.debug(`  Depth ${depth}: checking ${current.id}`);
            if (current.id === gizmo._rootMesh.id || current === gizmo._rootMesh) {
                this._logger.debug(`  MATCH! Found gizmo root`);
                return true;
            }
            // Also check if this is a gizmo arrow mesh
            if (current.id && current.id.includes('arrow')) {
                const parent = current.parent;
                this._logger.debug(`  Found arrow mesh, parent: ${parent?.id}`);
                if (parent && parent.id === gizmo._rootMesh.id) {
                    this._logger.debug(`  MATCH! Arrow parent is gizmo root`);
                    return true;
                }
            }
            current = current.parent;
            depth++;
        }
        this._logger.debug(`  No match after ${depth} iterations`);
        return false;
    }

    /**
     * Start dragging a gizmo axis with squeeze button
     */
    private startGizmoDrag(axis: any): void {
        this._activeGizmoAxis = axis;
        this._draggingGizmo = true;

        // Enable the drag behavior to start scaling
        if (axis && axis.dragBehavior) {
            // Manually enable drag mode for this axis
            axis.dragBehavior.enabled = true;

            // Get the pointer info for manual drag start
            const pointerInfo = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                null,
                false,
                this.scene.activeCamera
            );

            if (pointerInfo && pointerInfo.hit) {
                // Manually trigger the drag start with pointer information
                // The dragBehavior will handle the actual scaling logic
                this._logger.debug(`Starting gizmo drag on axis: ${axis._rootMesh?.id}`);
            }
        }
    }

    /**
     * End dragging a gizmo axis
     */
    private endGizmoDrag(): void {
        if (this._activeGizmoAxis) {
            this._logger.debug(`Ending gizmo drag`);

            // The drag behavior will auto-release, just clean up our state
            if (this._activeGizmoAxis.dragBehavior) {
                this._activeGizmoAxis.dragBehavior.enabled = true; // Keep enabled for future use
            }

            this._activeGizmoAxis = null;
            this._draggingGizmo = false;
        }
    }
}
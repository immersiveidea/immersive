import {
    AbstractMesh,
    GizmoManager,
    PointerEventTypes,
    PointerInfo,
    Scene,
    Vector3,
    WebXRExperienceHelper
} from "@babylonjs/core";
import {Button3D, GUI3DManager, StackPanel3D, TextBlock} from "@babylonjs/gui";
import {DiagramManager} from "../diagram/diagramManager";
import {BmenuState} from "./MenuState";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";
import {MeshConverter} from "../diagram/meshConverter";
import log from "loglevel";
import {InputTextView} from "../information/inputTextView";
import {Right} from "../controllers/right";
import {Left} from "../controllers/left";

export class EditMenu {
    private state: BmenuState = BmenuState.NONE;
    private manager: GUI3DManager;
    private readonly scene: Scene;
    private textView: InputTextView;
    private textInput: HTMLElement;
    private gizmoManager: GizmoManager;
    private readonly xr: WebXRExperienceHelper;
    private readonly diagramManager: DiagramManager;

    constructor(scene: Scene, xr: WebXRExperienceHelper, diagramManager: DiagramManager) {
        this.scene = scene;
        this.xr = xr;
        this.diagramManager = diagramManager;
        this.gizmoManager = new GizmoManager(scene);
        this.gizmoManager.boundingBoxGizmoEnabled = true;
        this.gizmoManager.gizmos.boundingBoxGizmo.scaleBoxSize = .020;
        this.gizmoManager.gizmos.boundingBoxGizmo.rotationSphereSize = .020;
        this.gizmoManager.gizmos.boundingBoxGizmo.scaleDragSpeed = 2;
        this.gizmoManager.clearGizmoOnEmptyPointerEvent = true;
        this.gizmoManager.usePointerToAttachGizmos = false;

        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERPICK:
                    if (pointerInfo.pickInfo?.pickedMesh?.metadata?.template &&
                        pointerInfo.pickInfo?.pickedMesh?.parent?.parent?.id != "toolbox") {
                        this.cleanup()
                            .then(() => {
                                log.getLogger("bmenu").debug("cleaned up");
                            })
                            .catch((e) => {
                                log.getLogger("bmenu").error(e);
                            });
                        this.handleEventStateAction(pointerInfo).then(() => {
                            log.getLogger("bmenu").debug("handled");
                        }).catch((e) => {
                            log.getLogger("bmenu").error(e);
                        });

                        break;
                    }
            }
        });
    }

    private async handleEventStateAction(pointerInfo: PointerInfo) {
        switch (this.state) {
            case BmenuState.REMOVING:
                log.debug("removing " + pointerInfo.pickInfo.pickedMesh.id);
                const event: DiagramEvent = {
                    type: DiagramEventType.REMOVE,
                    entity:
                        MeshConverter.toDiagramEntity(pointerInfo.pickInfo.pickedMesh)
                }
                this.diagramManager.onDiagramEventObservable.notifyObservers(event);
                break;
            case BmenuState.MODIFYING:
                if (pointerInfo.pickInfo.pickedMesh.metadata?.template &&
                    pointerInfo.pickInfo.pickedMesh.parent?.parent?.id != "toolbox") {
                    if (this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh?.id == pointerInfo.pickInfo?.pickedMesh?.id) {
                        this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh = null;
                    } else {
                        const mesh = pointerInfo.pickInfo.pickedMesh;
                        this.gizmoManager.attachToMesh(mesh);

                        this.gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragObservable.add(() => {
                            this.diagramManager.onDiagramEventObservable.notifyObservers({
                                    type: DiagramEventType.MODIFY,
                                    entity: MeshConverter.toDiagramEntity(mesh),
                                }
                            )
                            log.debug(mesh.scaling);
                        });
                    }
                }
                break;
            case BmenuState.LABELING:
                const mesh = pointerInfo.pickInfo.pickedMesh;
                log.debug("labeling " + mesh.id);
                const textInput = document.createElement("input");
                textInput.type = "text";
                document.body.appendChild(textInput);
                if (mesh?.metadata?.text) {
                    textInput.value = mesh.metadata.text;
                } else {
                    textInput.value = "";
                }
                if (this.xr.sessionManager.inXRSession) {
                    Right.instance.disable();
                    Left.instance.disable();
                }
                textInput.focus();

                if (navigator.userAgent.indexOf('Macintosh') > -1) {
                    textInput.addEventListener('input', (event) => {
                        log.debug(event);
                    });
                    const textView = new InputTextView(this.scene, this.xr, mesh)
                    await textView.show(textInput.value);
                    textInput.addEventListener('keydown', (event) => {
                        if (event.key == "Enter") {
                            log.getLogger('bmenu').debug("enter");
                            MeshConverter.updateTextNode(mesh, textInput.value);
                            this.persist(mesh, textInput.value);
                            this.cleanup();
                        } else {
                            textView.updateText(textInput.value);
                            MeshConverter.updateTextNode(mesh, textInput.value);
                        }
                    });
                    this.textView = textView;
                } else {
                    textInput.addEventListener('blur', () => {
                        log.getLogger('bmenu').debug("blur");
                        MeshConverter.updateTextNode(mesh, textInput.value);
                        this.persist(mesh, textInput.value);
                        this.cleanup();
                        Right.instance.enable();
                        Left.instance.enable();
                    });
                }
                this.textInput = textInput;
                break;
        }
    }
    private async cleanup() {
        if (this.textInput) {
            this.textInput.blur();
            this.textInput.remove();
        }
        this.textInput = null;
        this.textView && await this.textView.dispose();
        this.textView = null;

    }
    private persist(mesh: AbstractMesh, text: string) {
        if (mesh.metadata) {
            mesh.metadata.text = text;
        } else {
            log.getLogger('bmenu').error("mesh has no metadata");
        }
        this.diagramManager.onDiagramEventObservable.notifyObservers({
            type: DiagramEventType.MODIFY,
            entity: MeshConverter.toDiagramEntity(mesh),
        });
    }

    makeButton(name: string, id: string) {
        const button = new Button3D(name);
        button.scaling = new Vector3(.1, .1, .1);
        button.name = id;
        const text = new TextBlock(name, name);
        text.fontSize = "24px";
        text.color = "white";
        button.content = text;
        button.onPointerClickObservable.add(this.handleClick, -1, false, this);
        return button;
    }

    toggle() {
        //console.log(mesh.name);
        if (this.manager) {
            this.manager.dispose();
            this.manager = null;
        } else {
            this.manager = new GUI3DManager(this.scene);
            const panel = new StackPanel3D();
            this.manager.addControl(panel);
            panel.addControl(this.makeButton("Modify", "modify"));
            panel.addControl(this.makeButton("Remove", "remove"));
            panel.addControl(this.makeButton("Add Label", "label"));
            this.manager.controlScaling = .5;
            const offset = new Vector3(0, -.2, 3);
            offset.applyRotationQuaternionInPlace(this.scene.activeCamera.absoluteRotation);
            panel.node.position =
                this.scene.activeCamera.globalPosition.add(offset);
            panel.node.lookAt(this.scene.activeCamera.globalPosition);
            panel.node.rotation.y = panel.node.rotation.y + Math.PI;
        }
    }

    private handleClick(_info, state) {
        switch (state.currentTarget.name) {
            case "modify":
                this.state = BmenuState.MODIFYING;
                break;
            case "remove":
                this.state = BmenuState.REMOVING;
                break;
            case "label":
                this.state = BmenuState.LABELING;
                break;
            default:
                log.error("Unknown button");
                return;
        }
        this.manager.dispose();
        this.manager = null;
    }
}
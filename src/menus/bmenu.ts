import {GizmoManager, MeshBuilder, PointerEventTypes, Scene, Vector3, WebXRExperienceHelper} from "@babylonjs/core";
import {
    AdvancedDynamicTexture,
    Button3D,
    ColorPicker,
    GUI3DManager,
    InputText,
    StackPanel3D,
    TextBlock
} from "@babylonjs/gui";
import {DiagramManager} from "../diagram/diagramManager";
import {BmenuState} from "./MenuState";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";
import {MeshConverter} from "../diagram/meshConverter";

export class Bmenu {
    private state: BmenuState = BmenuState.NONE;
    private manager: GUI3DManager;
    private readonly scene: Scene;
    private gizmoManager: GizmoManager;
    private xr: WebXRExperienceHelper;
    private textInput: any;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        // this.textInput = document.createElement("input");
        //this.textInput.type = "text";
        // document.body.appendChild(this.textInput);
        this.scene = scene;
        this.xr = xr;
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
                        switch (this.state) {
                            case BmenuState.REMOVING:
                                console.log("removing " + pointerInfo.pickInfo.pickedMesh.id);
                                const event: DiagramEvent = {
                                    type: DiagramEventType.REMOVE,
                                    entity:
                                        MeshConverter.toDiagramEntity(pointerInfo.pickInfo.pickedMesh)
                                }
                                DiagramManager.onDiagramEventObservable.notifyObservers(event);
                                break;
                            case BmenuState.MODIFYING:
                                if (pointerInfo.pickInfo.pickedMesh.metadata?.template &&
                                    pointerInfo.pickInfo.pickedMesh.parent?.parent?.id != "toolbox") {
                                    if (this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh?.id == pointerInfo.pickInfo?.pickedMesh?.id) {
                                        this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh = null;
                                    } else {
                                        this.gizmoManager.attachToMesh(pointerInfo.pickInfo.pickedMesh);
                                    }

                                }

                                break;
                            case BmenuState.LABELING:
                                const mesh = pointerInfo.pickInfo.pickedMesh;
                                console.log("labeling " + mesh.id);
                                const myPlane = MeshBuilder.CreatePlane("myPlane", {width: .1, height: .1}, this.scene);
                                myPlane.parent=mesh;
                                myPlane.position= new Vector3(1,1,1);

                                const advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(myPlane, 1024, 1024);
                                const inputText = new InputText("input");
                                advancedTexture2.addControl(inputText);
                                inputText.scaleY = 5;
                                inputText.scaleX = 5;

                                inputText.focus();
                                inputText.onTextChangedObservable.add((text) => {
                                    console.log(text);
                                });
                                break;

                        }
                        break;
                    }
            }
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
        button.onPointerClickObservable.add(this.#clickhandler, -1, false, this);
        return button;
    }

    public getState() {
        return this.state;
    }

    public setState(state: BmenuState) {
        this.state = state;
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

    #clickhandler(_info, state) {
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
                console.log("Unknown button");
                return;
        }
        this.manager.dispose();
        this.manager = null;
    }
}
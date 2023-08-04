import {
    AbstractMesh,
    CreateGreasedLine,
    GizmoManager,
    GreasedLineMesh,
    GreasedLineTools,
    PointerEventTypes,
    PointerInfo,
    Scene,
    TransformNode,
    Vector3,
    WebXRExperienceHelper
} from "@babylonjs/core";
import {Button3D, GUI3DManager, StackPanel3D, TextBlock} from "@babylonjs/gui";
import {DiagramManager} from "../diagram/diagramManager";
import {EditMenuState} from "./MenuState";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";
import {MeshConverter} from "../diagram/meshConverter";
import log from "loglevel";
import {InputTextView} from "../information/inputTextView";
import {DiaSounds} from "../util/diaSounds";
import {CameraHelper} from "../util/cameraHelper";
import {TextLabel} from "../diagram/textLabel";

class DiagramConnection {
    private mesh: GreasedLineMesh;
    private readonly scene: Scene;
    private readonly fromPoint: Vector3 = new Vector3();
    private readonly toPoint: Vector3 = new Vector3();
    private toAnchor: TransformNode;
    private pointerInfo: PointerInfo;
    private points: Vector3[] = [];

    constructor(from: string, to: string, id: string, scene: Scene, pointerInfo: PointerInfo) {
        this._from = from;
        this._to = to;
        this._id = id;
        this.scene = scene;
        this.pointerInfo = pointerInfo;

        if (from) {
            const fromPoint = this.scene.getMeshById(from).getAbsolutePosition().clone();
            this.fromPoint.copyFrom(fromPoint);
            this.toAnchor = new TransformNode("toAnchor", this.scene);
            this.toAnchor.position = fromPoint;
            this.toAnchor.setParent(pointerInfo.pickInfo.gripTransform);
            this.buildConnection();
        }
    }

    public _from: string;

    public get from(): string {
        return this._from;
    }

    public set from(value: string) {
        this._from = value;
    }

    public _to: string;

    public get to(): string {
        return this._to;
    }

    public set to(value: string) {
        this._to = value;
    }

    public _id: string;

    public get id(): string {
        return this._id;
    }

    private recalculate() {
        this.points = [this.fromPoint, this.toAnchor.absolutePosition];
    }

    private setPoints() {
        this.mesh.setPoints([GreasedLineTools.ToNumberArray(this.points)]);
    }

    private buildConnection() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.recalculate();
            this.setPoints();
        });

        this.recalculate();

        this.mesh = CreateGreasedLine("connection",
            {points: (GreasedLineTools.ToNumberArray(this.points) as number[]), updatable: true}, null, this.scene);

        this.setPoints();
        //this.mesh.outlineColor = new Color3(0.5, 0.5, 1);
    }
}

export class EditMenu {
    private state: EditMenuState = EditMenuState.NONE;
    private manager: GUI3DManager;
    private readonly scene: Scene;
    private readonly logger: log.Logger = log.getLogger('EditMenu');
    private gizmoManager: GizmoManager;
    private readonly xr: WebXRExperienceHelper;
    private readonly diagramManager: DiagramManager;
    private connection: DiagramConnection = null;

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
                        this.diagramEntityPicked(pointerInfo).then(() => {
                            this.logger.debug("handled");
                        }).catch((e) => {
                            this.logger.error(e);
                        });
                        break;
                    }
            }
        });
    }

    toggle() {
        if (this.manager) {
            DiaSounds.instance.exit.play();
            this.manager.dispose();
            this.manager = null;
        } else {
            DiaSounds.instance.enter.play();
            this.manager = new GUI3DManager(this.scene);
            const panel = new StackPanel3D();
            this.manager.addControl(panel);
            panel.addControl(this.makeButton("Modify", "modify"));
            panel.addControl(this.makeButton("Remove", "remove"));
            panel.addControl(this.makeButton("Add Label", "label"));
            panel.addControl(this.makeButton("Copy", "copy"));
            panel.addControl(this.makeButton("Connect", "connect"));

            //panel.addControl(this.makeButton("Add Ring Cameras", "addRingCameras"));
            this.manager.controlScaling = .5;
            CameraHelper.setMenuPosition(panel.node, this.scene);
        }
    }

    private persist(mesh: AbstractMesh, text: string) {
        if (mesh.metadata) {
            mesh.metadata.text = text;
        } else {
            this.logger.error("mesh has no metadata");
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

    private async diagramEntityPicked(pointerInfo: PointerInfo) {
        const mesh = pointerInfo.pickInfo.pickedMesh;
        if (!mesh) {
            this.logger.warn("no mesh");
            return;
        }
        switch (this.state) {
            case EditMenuState.REMOVING:
                this.remove(mesh);
                break;
            case EditMenuState.MODIFYING:
                this.setModify(mesh);
                break;
            case EditMenuState.LABELING:
                this.setLabeling(mesh);
                break;
            case EditMenuState.COPYING:
                this.setCopying(mesh);
                break;
            case EditMenuState.CONNECTING:
                this.setConnecting(mesh, pointerInfo);
                break;
        }
    }

    private setConnecting(mesh: AbstractMesh, pointerInfo) {
        if (this.connection) {
            this.connection.to = mesh.id;
            this.diagramManager.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: this.connection,
            });
            this.connection = null;
        } else {
            this.connection = new DiagramConnection(mesh.id, null, null, this.scene, pointerInfo);
        }
    }

    private remove(mesh: AbstractMesh) {
        this.logger.debug("removing " + mesh?.id);
        const event: DiagramEvent = {
            type: DiagramEventType.REMOVE,
            entity:
                MeshConverter.toDiagramEntity(mesh)
        }
        this.diagramManager.onDiagramEventObservable.notifyObservers(event);
    }

    private setModify(mesh: AbstractMesh) {
        if (mesh.metadata?.template &&
            mesh.parent?.parent?.id != "toolbox") {
            if (this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh?.id == mesh.id) {
                this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh = null;
            } else {
                this.gizmoManager.attachToMesh(mesh);
                this.gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragObservable.add(() => {
                    this.diagramManager.onDiagramEventObservable.notifyObservers({
                            type: DiagramEventType.MODIFY,
                            entity: MeshConverter.toDiagramEntity(mesh),
                        }
                    )
                    this.logger.debug(mesh.scaling);
                });
            }
        }
    }

    private setCopying(mesh: AbstractMesh) {
        if (mesh) {
            const newMesh = this.diagramManager.createCopy(mesh, true);
            newMesh.setParent(null);
        }
        this.logger.warn('copying not implemented', mesh);
        //@todo implement
    }

    private setLabeling(mesh: AbstractMesh) {
        this.logger.debug("labeling " + mesh.id);
        let text = "";
        if (mesh?.metadata?.text) {
            text = mesh.metadata.text;
        }
        const textInput = new InputTextView({xrSession: this.xr.sessionManager, text: text});
        textInput.show();
        textInput.onTextObservable.addOnce((value) => {
            this.persist(mesh, value.text);
            TextLabel.updateTextNode(mesh, value.text);
        });

    }

    private handleClick(_info, state) {
        switch (state.currentTarget.name) {
            case "modify":
                this.state = EditMenuState.MODIFYING;
                break;
            case "remove":
                this.state = EditMenuState.REMOVING;
                break;
            case "label":
                this.state = EditMenuState.LABELING;
                break;
            case "copy":
                this.state = EditMenuState.COPYING;
                break;
            case "connect":
                this.state = EditMenuState.CONNECTING;
                break;
            default:
                this.logger.error("Unknown button");
                return;
        }
        this.manager.dispose();
        this.manager = null;
    }
}
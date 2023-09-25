import {
    AbstractMesh,
    Color3,
    GizmoManager,
    InstancedMesh,
    Mesh,
    PointerEventTypes,
    PointerInfo,
    Scene,
    StandardMaterial,
    Vector3,
    WebXRDefaultExperience,
} from "@babylonjs/core";
import {GUI3DManager, PlanePanel} from "@babylonjs/gui";
import {DiagramManager} from "../diagram/diagramManager";
import {EditMenuState} from "./editMenuState";
import {DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";
import log from "loglevel";
import {InputTextView} from "../information/inputTextView";
import {DiaSounds} from "../util/diaSounds";
import {TextLabel} from "../diagram/textLabel";
import {DiagramConnection} from "../diagram/diagramConnection";

import {toDiagramEntity} from "../diagram/functions/toDiagramEntity";
import {AbstractMenu} from "./abstractMenu";
import {Controllers} from "../controllers/controllers";
import {setMenuPosition} from "../util/functions/setMenuPosition";
import {DiagramExporter} from "../util/diagramExporter";
import {SoccerMenu} from "../soccer/soccerMenu";

export class EditMenu extends AbstractMenu {
    private state: EditMenuState = EditMenuState.NONE;
    private manager: GUI3DManager;
    private paintColor: string = null;
    private readonly logger: log.Logger = log.getLogger('EditMenu');
    private gizmoManager: GizmoManager;
    private readonly diagramManager: DiagramManager;
    private connection: DiagramConnection = null;
    private panel: PlanePanel;
    private sounds: DiaSounds;

    private get isVisible(): boolean {
        return this.panel.isVisible;
    }

    private soccerMenu: SoccerMenu;

    private set isVisible(visible: boolean) {
        this.panel.isVisible = visible;
        this.panel.children.forEach((child) => {
            child.isVisible = visible;
        });
        this.handle.mesh.isVisible = visible;
    }
    private getTool(template: string, color: Color3): Mesh {
        const baseMeshId = 'tool-' + template + '-' + color.toHexString();
        return (this.scene.getMeshById(baseMeshId) as Mesh);
    }

    private persist(mesh: AbstractMesh, text: string) {
        if (mesh.metadata) {
            mesh.metadata.text = text;
        } else {
            this.logger.error("mesh has no metadata");
        }
        this.diagramManager.onDiagramEventObservable.notifyObservers({
            type: DiagramEventType.MODIFY,
            entity: toDiagramEntity(mesh),
        }, -1);
    }

    toggle() {
        if (this.isVisible) {
            this.sounds.exit.play();
            this.isVisible = false;

        } else {
            this.sounds.enter.play();
            setMenuPosition(this.handle.mesh, this.scene, new Vector3(0, .4, 0));
            this.isVisible = true;
        }
    }

    makeButton(name: string, id: string) {
        const button = super.makeButton(name, id);
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
                this.removeMesh(mesh);
                break;
            case EditMenuState.MODIFYING:
                this.modifyMesh(mesh);
                break;
            case EditMenuState.LABELING:
                this.labelMesh(mesh);
                break;
            case EditMenuState.COPYING:
                this.copyMesh(mesh);
                break;
            case EditMenuState.CONNECTING:
                this.createMeshConnection(mesh, pointerInfo);
                break;
            case EditMenuState.RECOLORING:
                if (this.paintColor) {
                    const template = mesh.metadata.template;
                    const newBase = this.getTool(template,
                        Color3.FromHexString(this.paintColor));
                    if (!newBase) {
                        return;
                    }
                    const newMesh = (mesh as InstancedMesh).clone(mesh.name, mesh.parent, false, newBase);
                    newMesh.id = mesh.id;
                    newMesh.physicsBody = mesh.physicsBody;
                    newMesh.metadata = mesh.metadata;
                    mesh.physicsBody = null;
                    mesh.dispose();
                    this.diagramManager.onDiagramEventObservable.notifyObservers({
                        type: DiagramEventType.MODIFY,
                        entity: toDiagramEntity(newMesh)
                    }, -1);

                } else {
                    this.logger.error("no paint color selectced");
                }
        }
    }

    private createMeshConnection(mesh: AbstractMesh, pointerInfo) {
        if (this.connection) {
            this.connection.to = mesh.id;
            this.diagramManager.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.ADD,
                entity: toDiagramEntity(this.connection.mesh)
            }, -1);
            this.connection = null;
        } else {
            this.connection = new DiagramConnection(mesh.id, null, null, this.scene, pointerInfo);
        }
    }

    private removeMesh(mesh: AbstractMesh) {
        this.logger.debug("removing " + mesh?.id);
        const event: DiagramEvent = {
            type: DiagramEventType.REMOVE,
            entity:
                toDiagramEntity(mesh)
        }

        this.diagramManager.onDiagramEventObservable.notifyObservers(event, -1);
    }

    private modifyMesh(mesh: AbstractMesh) {
        if (mesh.metadata?.template &&
            mesh.parent?.parent?.id != "toolbox") {
            if (this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh?.id == mesh.id) {
                this.gizmoManager.gizmos.boundingBoxGizmo.attachedMesh = null;
            } else {
                this.gizmoManager.attachToMesh(mesh);
                this.gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragObservable.add(() => {
                    this.diagramManager.onDiagramEventObservable.notifyObservers({
                            type: DiagramEventType.MODIFY,
                            entity: toDiagramEntity(mesh),
                        }, -1
                    )
                    this.logger.debug(mesh.scaling);
                });
            }
        }
    }

    private copyMesh(mesh: AbstractMesh) {
        if (mesh) {
            const newMesh = this.diagramManager.createCopy(mesh, true);
            newMesh.setParent(mesh.parent);
        }
        this.logger.warn('copying not implemented', mesh);
        //@todo implement
    }

    private labelMesh(mesh: AbstractMesh) {
        this.logger.debug("labeling " + mesh.id);
        let text = "";
        if (mesh?.metadata?.text) {
            text = mesh.metadata.text;
        }
        const textInput = new InputTextView(text, this.xr, this.scene, this.controllers);

        textInput.show();
        textInput.onTextObservable.addOnce((value) => {
            this.persist(mesh, value.text);
            TextLabel.updateTextNode(mesh, value.text);
        });


    }

    private showNewRelic() {
        const inputTextView = new InputTextView('test', this.xr, this.scene, this.controllers);
        inputTextView.show();
        inputTextView.onTextObservable.addOnce((value) => {
            const config = this.diagramManager.config.current;
            config.newRelicKey = value.text;
            this.diagramManager.config.current = config;
            inputTextView.show();
            inputTextView.onTextObservable.addOnce((value) => {
                const config = this.diagramManager.config.current;
                config.newRelicAccount = value.text;
                this.diagramManager.config.current = config;
            });
        });


    }

    constructor(scene: Scene, xr: WebXRDefaultExperience, diagramManager: DiagramManager, controllers: Controllers) {
        super(scene, xr, controllers);
        this.scene = scene;
        this.sounds = new DiaSounds(scene);
        this.diagramManager = diagramManager;
        this.gizmoManager = new GizmoManager(scene);
        this.gizmoManager.boundingBoxGizmoEnabled = true;
        this.gizmoManager.gizmos.boundingBoxGizmo.scaleBoxSize = .020;
        this.gizmoManager.gizmos.boundingBoxGizmo.rotationSphereSize = .020;
        this.gizmoManager.gizmos.boundingBoxGizmo.scaleDragSpeed = 2;
        this.gizmoManager.clearGizmoOnEmptyPointerEvent = true;
        this.gizmoManager.usePointerToAttachGizmos = false;
        this.manager = new GUI3DManager(this.scene);
        const panel = new PlanePanel();

        panel.columns = 4;
        this.manager.addControl(panel);

        panel.addControl(this.makeButton("Modify", "modify"));
        panel.addControl(this.makeButton("Remove", "remove"));
        panel.addControl(this.makeButton("Add Label", "label"));
        panel.addControl(this.makeButton("Copy", "copy"));
        panel.addControl(this.makeButton("Connect", "connect"));
        panel.addControl(this.makeButton("Export", "export"));
        panel.addControl(this.makeButton("Recolor", "recolor"));
        panel.addControl(this.makeButton("New Relic", "newrelic"));
        panel.addControl(this.makeButton("Soccer", "soccer"));
        //panel.addControl(this.makeButton("Add Ring Cameras", "addRingCameras"));
        this.manager.controlScaling = .1;
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERPICK:
                    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
                    if (pickedMesh.metadata?.template &&
                        pickedMesh?.parent?.parent?.id != "toolbox") {
                        this.diagramEntityPicked(pointerInfo).then(() => {
                            this.logger.debug("handled");
                        }).catch((e) => {
                            this.logger.error(e);
                        });
                        break;
                    } else {
                        const tool = pickedMesh?.metadata?.tool;
                        if (tool) {
                            this.logger.debug("tool type", tool);
                            this.paintColor = (pickedMesh.material as StandardMaterial).diffuseColor.toHexString();
                            this.logger.debug((pickedMesh.material as StandardMaterial).diffuseColor.toHexString());
                            this.logger.debug(pickedMesh.id);
                        }

                    }
            }
        });
        this.panel = panel;
        this.createHandle(this.manager.rootContainer.children[0].node);
        this.manager.rootContainer.children[0].node.position.y = .2;
        this.isVisible = false;

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
            case "recolor":
                this.state = EditMenuState.RECOLORING;
                break;
            case "newrelic":
                this.showNewRelic();
                break;
            case "export":
                this.download();
                break;
            case "soccer":
                this.createSoccerField();
                break;
            default:
                this.logger.error("Unknown button");
                return;

        }

        this.isVisible = false;
    }

    private createSoccerField() {
        if (!this.soccerMenu) {
            this.soccerMenu = new SoccerMenu(this.scene, this.xr, this.controllers);
        }
    }

    private download() {
        const exporter = new DiagramExporter(this.scene);
        exporter.export();
    }
}
import {
    AbstractMesh,
    Scene,
    Vector3,
    WebXRExperienceHelper,
    WebXRInputSource
} from "@babylonjs/core";
import {GUI3DManager, NearMenu, TouchHolographicButton} from "@babylonjs/gui";
import {DiagramManager} from "../diagram/diagramManager";
import {BmenuState} from "./MenuState";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "../diagram/diagramEntity";


export class Bmenu {
    private state: BmenuState = BmenuState.NONE;
    private manager: GUI3DManager;
    private readonly scene: Scene;

    private rightController: AbstractMesh;
    private xr: WebXRExperienceHelper;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;

        DiagramManager.onDiagramEventObservable.add((event: DiagramEvent) => {
            if (event.type === DiagramEventType.DROPPED) {
                this.state = BmenuState.ADDING;
            }
        });

    }

    setController(controller: WebXRInputSource) {
        this.rightController = controller.grip;
    }

    makeButton(name: string, id: string) {
        const button = new TouchHolographicButton(name);
        button.text = name;
        button.name = id;
        button.onPointerClickObservable.add(this.#clickhandler, -1, false, this);
        return button;
    }

    public getState() {
        return this.state;
    }

    public setState(state: BmenuState) {
        this.state = state;
    }

    toggle(mesh: AbstractMesh) {
        console.log(mesh.name);
        if (this.manager) {
            this.manager.dispose();
            this.manager = null;
        } else {
            this.manager = new GUI3DManager(this.scene);
            const panel = new NearMenu();
            this.manager.addControl(panel);
            const follower = panel.defaultBehavior.followBehavior;
            follower.maxViewHorizontalDegrees = 45;
            follower.useFixedVerticalOffset = true;
            follower.fixedVerticalOffset = 1;
            follower.defaultDistance = 2;
            follower.maximumDistance = 3;
            follower.minimumDistance = 1;

            panel.backPlateMargin = .01;
            panel.scaling = new Vector3(.5, .5, .1);
            panel.margin = .01;
            //panel.scaling.x = .5;
            //panel.scaling.y = .5;
            //const camdir = panel.mesh.getDirection(this.xr.camera.globalPosition);
            //panel.mesh.lookAt(this.xr.camera.globalPosition);
            panel.addButton(this.makeButton("Add Box", "addBox"));
            panel.addButton(this.makeButton("Add Sphere", "addSphere"));
            panel.addButton(this.makeButton("Add Cylinder", "addCylinder"));
            panel.addButton(this.makeButton("Add Text", "addText"));
            panel.addButton(this.makeButton("Done Adding", "doneAdding"));
            this.manager.controlScaling = .5;

        }
    }

    #clickhandler(_info, state) {
        console.log(state.currentTarget.name);

        const id = this?.rightController?.id || null;
        let entity: DiagramEntity = {
            template: null,
            position: new Vector3(-0.02, -.090, .13),
            rotation: new Vector3(76.04, 0, 0),
            scale: new Vector3(.1, .1, .1),
            color: "#CC0000",
            text: "text",
            last_seen: new Date(),
            parent: id
        };

        switch (state.currentTarget.name) {
            case "addBox":
                entity.template = "#box-template";
                this.state = BmenuState.ADDING;
                break;
            case "addSphere":
                entity.template = "#sphere-template";
                this.state = BmenuState.ADDING;
                break;
            case "addCylinder":
                entity.template = "#cylinder-template";
                this.state = BmenuState.ADDING;
                break;
            case "addText":
                entity.template = "#text-template";
                this.state = BmenuState.ADDING;
                break;
            case "doneAdding":
                this.state = BmenuState.NONE;

                break;
            default:
                console.log("Unknown button");
                return;
        }
        if (this.state === BmenuState.ADDING) {
            const event: DiagramEvent = {
                type: DiagramEventType.ADD,
                entity: entity
            }
            DiagramManager.onDiagramEventObservable.notifyObservers(event);
        } else {
            const event: DiagramEvent = {
                type: DiagramEventType.CLEAR
            }
            DiagramManager.onDiagramEventObservable.notifyObservers(event);
        }
    }
}
import {AbstractMesh, AxesViewer, Color3, Node, Observable, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {GUI3DManager, StackPanel3D,} from "@babylonjs/gui";
import {buildColor} from "./functions/buildColor";
import log from "loglevel";
import {Handle} from "../objects/handle";
import {DefaultScene} from "../defaultScene";

const colors: string[] = [
    "#222222", "#8b4513", "#006400", "#778899",
    "#4b0082", "#ff0000", "#ffa500", "#ffff00",
    "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
    "#1e90ff", "#98fb98", "#ffe4b5", "#ff69b4"
]


export class Toolbox {
    private readonly logger = log.getLogger('Toolbox');
    private index = 0;
    public readonly toolboxBaseNode: TransformNode;
    private readonly scene: Scene;
    private colorPicker: TransformNode;
    private changing = false;
    private readonly handle: Handle;
    private readonly manager: GUI3DManager;
    private readonly addPanel: StackPanel3D;
    public readonly colorChangeObservable: Observable<{ oldColor: string, newColor: string }> =
        new Observable<{ oldColor: string; newColor: string }>()
    private axes: AxesViewer;

    constructor() {
        this.scene = DefaultScene.Scene;
        this.addPanel = new StackPanel3D();
        this.manager = new GUI3DManager(this.scene);
        this.manager.addControl(this.addPanel);
        this.toolboxBaseNode = new TransformNode("toolbox", this.scene);
        this.handle = new Handle(this.toolboxBaseNode);
        this.toolboxBaseNode.position.y = .2;
        this.toolboxBaseNode.scaling = new Vector3(0.6, 0.6, 0.6);
        this.buildToolbox();
    }

    public updateToolbox(color: string) {
        if (color) {
            if (this.scene.getMeshById("toolbox-color-" + color)) {
                return;
            } else {
                buildColor(Color3.FromHexString(color), this.scene, this.toolboxBaseNode, this.index++);
            }
        } else {
            this.logger.warn("updateToolbox called with no color");
        }

    }

    private nodePredicate = (node: Node) => {
        return node.getClassName() == "InstancedMesh" &&
            node.isEnabled(false) == true
    };

    private buildToolbox() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type == 1 && pointerInfo.pickInfo.pickedMesh?.metadata?.tool == 'color') {
                if (this.changing) {
                    this.colorPicker.setEnabled(true);
                    return;
                } else {
                    const active = pointerInfo.pickInfo.pickedMesh?.parent.getChildren(this.nodePredicate, true);
                    for (const node of active) {
                        node.setEnabled(false);
                    }
                    const nodes = pointerInfo.pickInfo.pickedMesh?.metadata?.tools;
                    if (nodes) {
                        for (const node of nodes) {
                            this.scene.getNodeById(node)?.setEnabled(true);
                        }
                    }
                }
            }
        });
        let initial = true;
        for (const c of colors) {
            const cnode = buildColor(Color3.FromHexString(c), this.scene, this.toolboxBaseNode, this.index++);
            if (initial) {
                initial = false;
                for (const id of cnode.metadata.tools) {
                    this.scene.getNodeById(id)?.setEnabled(true);
                }

            }
        }

        const offset = new Vector3(-.50, 1.6, .38);
        const rotation = new Vector3(.5, -.6, .18);

        if (this.toolboxBaseNode.parent) {
            const platform = this.scene.getNodeById("platform");

            if (platform) {
                const handle = this.handle;
                handle.mesh.parent = platform;
                if (!handle.idStored) {
                    handle.mesh.position = offset;
                    handle.mesh.rotation = rotation;
                }

            } else {
                this.scene.onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
                    if (mesh && mesh.id == "platform") {
                        const handle = this.handle;
                        handle.mesh.parent = mesh;
                        if (!handle.idStored) {
                            handle.mesh.position = offset;
                            handle.mesh.rotation = rotation;
                        }
                        //handle.mesh.parent = mesh;

                    }
                }, -1, false, this, false);
            }

        }

        /*setMenuPosition(this.toolboxBaseNode.parent as Mesh, this.scene,
            Vector3.Zero());*/
    }

    public get handleMesh(): AbstractMesh {
        return this.handle.mesh;
    }
}


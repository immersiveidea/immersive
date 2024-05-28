import {AbstractMesh, Color3, InstancedMesh, Node, Scene, TransformNode, Vector3} from "@babylonjs/core";
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
    private readonly tools: Map<string, InstancedMesh> = new Map<string, InstancedMesh>();

    constructor() {
        this.scene = DefaultScene.Scene;
        this.toolboxBaseNode = new TransformNode("toolbox", this.scene);
        this.handle = new Handle(this.toolboxBaseNode);
        this.toolboxBaseNode.position.y = .2;
        this.toolboxBaseNode.scaling = new Vector3(0.6, 0.6, 0.6);
        this.buildToolbox();
        Toolbox._instance = this;
    }
    private readonly logger = log.getLogger('Toolbox');
    private index = 0;
    public readonly toolboxBaseNode: TransformNode;
    private readonly scene: Scene;
    private colorPicker: TransformNode;
    private changing = false;
    private readonly handle: Handle;

    public static _instance;

    public static get instance() {
        return Toolbox._instance;
    }

    public isTool(mesh: AbstractMesh) {
        return this.tools.has(mesh.id);
    }
    private nodePredicate = (node: Node) => {
        return node.getClassName() == "InstancedMesh" &&
            node.isEnabled(false) == true
    };

    private setupPointerObservable() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type == 1 &&
                pointerInfo.pickInfo.pickedMesh?.metadata?.tool == 'color') {
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
    }

    private buildColorPicker() {
        let initial = true;
        for (const c of colors) {
            const cnode = buildColor(Color3.FromHexString(c), this.scene, this.toolboxBaseNode, this.index++, this.tools);
            if (initial) {
                initial = false;
                for (const id of cnode.metadata.tools) {
                    this.scene.getNodeById(id)?.setEnabled(true);
                }

            }
        }

    }

    private assignHandleParentAndStore(mesh: TransformNode) {
        const offset = new Vector3(-.50, 1.6, .38);
        const rotation = new Vector3(.5, -.6, .18);

        const handle = this.handle;
        handle.mesh.parent = mesh;
        if (!handle.idStored) {
            handle.mesh.position = offset;
            handle.mesh.rotation = rotation;
        }

    }

    private buildToolbox() {
        this.setupPointerObservable();
        this.buildColorPicker();
        if (this.toolboxBaseNode.parent) {
            const platform = this.scene.getMeshById("platform");
            if (platform) {
                this.assignHandleParentAndStore(platform);
            } else {
                const observer = this.scene.onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
                    if (mesh && mesh.id == "platform") {
                        this.assignHandleParentAndStore(mesh);
                        this.scene.onNewMeshAddedObservable.remove(observer);
                    }
                }, -1, false, this, false);
            }
        }
    }
    public get handleMesh(): AbstractMesh {
        return this.handle.mesh;
    }
}


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
    public readonly _toolboxBaseNode: TransformNode;
    private readonly _tools: Map<string, InstancedMesh> = new Map<string, InstancedMesh>();
    private readonly _logger = log.getLogger('Toolbox');
    private readonly _handle: Handle;
    private readonly _scene: Scene;

    constructor() {
        this._scene = DefaultScene.Scene;
        this._toolboxBaseNode = new TransformNode("toolbox", this._scene);
        this._handle = new Handle(this._toolboxBaseNode, 'Toolbox');
        this._toolboxBaseNode.position.y = .2;
        this._toolboxBaseNode.scaling = new Vector3(0.6, 0.6, 0.6);
        this.buildToolbox();
        Toolbox._instance = this;
    }
    private index = 0;
    private colorPicker: TransformNode;
    private changing = false;

    public static _instance: Toolbox;

    public static get instance() {
        return Toolbox._instance;
    }

    public get handleMesh(): AbstractMesh {
        return this._handle.mesh;
    }

    public isTool(mesh: AbstractMesh) {
        return this._tools.has(mesh.id);
    }

    private buildToolbox() {
        this.setupPointerObservable();
        this.buildColorPicker();
        if (this._toolboxBaseNode.parent) {
            const platform = this._scene.getMeshById("platform");
            if (platform) {
                this.assignHandleParentAndStore(platform);
            } else {
                const observer = this._scene.onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
                    if (mesh && mesh.id == "platform") {
                        this.assignHandleParentAndStore(mesh);
                        this._scene.onNewMeshAddedObservable.remove(observer);
                    }
                }, -1, false, this, false);
            }
        }
    }

    private setupPointerObservable() {
        this._scene.onPointerObservable.add((pointerInfo) => {
            const pickedMesh = pointerInfo?.pickInfo?.pickedMesh;
            if (pointerInfo.type == 1 &&
                pickedMesh?.metadata?.tool == 'color') {
                if (this.changing) {
                    this._logger.debug('changing');
                    this.colorPicker.setEnabled(true);
                    return;
                } else {
                    const active = pickedMesh?.parent.getChildren(this.nodePredicate, true);
                    for (const node of active) {
                        node.setEnabled(false);
                    }
                    const nodes = pickedMesh?.metadata?.tools;
                    if (nodes) {
                        for (const node of nodes) {
                            this._scene.getNodeById(node)?.setEnabled(true);
                        }
                    }
                }
            }
        });
    }

    private nodePredicate = (node: Node) => {
        return node.getClassName() == "InstancedMesh" &&
            node.isEnabled(false) == true
    };

    private buildColorPicker() {
        let initial = true;
        for (const c of colors) {
            const cnode = buildColor(Color3.FromHexString(c), this._scene, this._toolboxBaseNode, this.index++, this._tools);
            if (initial) {
                initial = false;
                for (const id of cnode.metadata.tools) {
                    this._scene.getNodeById(id)?.setEnabled(true);
                }

            }
        }
    }

    private assignHandleParentAndStore(mesh: TransformNode) {
        const offset = new Vector3(-.50, 1.6, .38);
        const rotation = new Vector3(.5, -.6, .18);

        const handle = this._handle;
        handle.mesh.parent = mesh;
        if (!handle.idStored) {
            handle.mesh.position = offset;
            handle.mesh.rotation = rotation;
        }

    }
}


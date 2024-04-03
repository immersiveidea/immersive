import {AxesViewer, Color3, Mesh, Node, Observable, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {GUI3DManager, StackPanel3D,} from "@babylonjs/gui";
import {setMenuPosition} from "../util/functions/setMenuPosition";
import {buildColor} from "./functions/buildColor";
import log from "loglevel";
import {Handle} from "../objects/handle";

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
    private readonly manager: GUI3DManager;
    private readonly addPanel: StackPanel3D;
    public readonly colorChangeObservable: Observable<{ oldColor: string, newColor: string }> =
        new Observable<{ oldColor: string; newColor: string }>()
    private handle: Handle;
    private axes: AxesViewer;

    constructor(scene: Scene) {
        this.scene = scene;
        this.addPanel = new StackPanel3D();
        this.manager = new GUI3DManager(scene);
        this.manager.addControl(this.addPanel);
        this.toolboxBaseNode = new TransformNode("toolbox", this.scene);
        this.handle = new Handle(this.toolboxBaseNode);
        this.toolboxBaseNode.position.y = .2;
        //this.toolboxBaseNode.position.z = .05;
        /**this.axes = new AxesViewer(this.scene);
         this.axes.xAxis.parent = this.toolboxBaseNode;
         this.axes.yAxis.parent = this.toolboxBaseNode;
         this.axes.zAxis.parent = this.toolboxBaseNode;*/
        this.toolboxBaseNode.scaling = new Vector3(0.6, 0.6, 0.6);
        this.buildToolbox();
    }

    public toggle() {
        this.toolboxBaseNode.parent.setEnabled(!this.toolboxBaseNode.parent.isEnabled(false));
        setMenuPosition(this.toolboxBaseNode.parent as Mesh, this.scene,
            Vector3.Zero());
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
        this.toolboxBaseNode.parent.setEnabled(false);
        setMenuPosition(this.toolboxBaseNode.parent as Mesh, this.scene,
            Vector3.Zero());
    }
}


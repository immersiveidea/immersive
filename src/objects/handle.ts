import {AbstractMesh, InstancedMesh, Mesh, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {HtmlMeshBuilder} from "babylon-html";

export class Handle {
    public mesh: AbstractMesh;
    private readonly menuItem: TransformNode;
    private _isStored: boolean = false;
    private offset: Vector3;
    private rotation: Vector3;

    constructor(mesh: TransformNode, offset: Vector3 = Vector3.Zero(), rotation: Vector3 = Vector3.Zero()) {
        this.menuItem = mesh;
        this.offset = offset;
        this.rotation = rotation;
        this.buildHandle();
    }

    public get idStored() {
        return this._isStored;
    }
    private buildHandle() {
        const scene: Scene = this.menuItem.getScene();
        const handle = getHandleMesh("handle-" + this.menuItem.id + "-mesh", scene);
        if (this.menuItem) {
            this.menuItem.setParent(handle);
        }
        const stored = localStorage.getItem(handle.id);
        if (stored) {
            try {
                const locationdata = JSON.parse(stored);
                handle.position = new Vector3(locationdata.position.x, locationdata.position.y, locationdata.position.z);
                handle.rotation = new Vector3(locationdata.rotation.x, locationdata.rotation.y, locationdata.rotation.z);
                this._isStored = true;
            } catch (e) {
                console.error(e);
                handle.position = Vector3.Zero();
            }
        } else {
            handle.position = this.offset;
            handle.rotation = this.rotation;
            ``
        }
        handle.metadata = {handle: true};
        this.mesh = handle;
    }

    private setPlatformParent() {
        const platform = this.menuItem.getScene().getNodeById("platform");

        if (platform) {

            this.mesh.parent = platform;
            /*if (handle.mesh.position.x != 0 && handle.mesh.position.y != 0 && handle.mesh.position.z != 0) {
                offset = handle.mesh.position;
            }
            if (handle.mesh.rotation.x != 0 && handle.mesh.rotation.y != 0 && handle.mesh.rotation.z != 0) {
                rotation = handle.mesh.rotation;
            }*/
            //handle.mesh.parent = platform;
            if (!this._isStored) {
                this.mesh.position = this.offset;
                this.mesh.rotation = this.rotation;
            }

        } else {
            this.menuItem.getScene().onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
                if (mesh && mesh.id == "platform") {
                    //const handle = this.handle;
                    this.menuItem.parent = mesh;
                    if (!this._isStored) {
                        this.mesh.position = this.offset;
                        this.mesh.rotation = this.rotation;
                    }
                }
            }, -1, false, this, false);
        }

    }
}


function getHandleMesh(name: string, scene: Scene): InstancedMesh {
    const existingBase = scene.getMeshById("base-handle-mesh");
    if (existingBase) {
        const instance = new InstancedMesh(name, (existingBase as Mesh));
        instance.setParent(scene.getMeshByName("platform"));
        return instance;
    }
    /*const handle = MeshBuilder.CreateCapsule("base-handle-mesh", {
        radius: .04,
        orientation: Vector3.Right(),
        height: .3
    }, scene);*/
    const handle = HtmlMeshBuilder.CreatePlaneSync("base-handle-mesh", {
        html:
            `<div style="width: 100%; height: 100%; border-radius: 32px; background-color: #111122; color: #eeeeee"><center>Handle</center></div>
        `, width: .5, height: .1, image: {width: 256, height: 51}
    }, scene);

    //handle.material = buildStandardMaterial('base-handle-material', scene, "#CCCCDD");
    handle.id = "base-handle-mesh";
    const instance = new InstancedMesh(name, (handle as Mesh));
    instance.setParent(scene.getMeshById("platform"));
    return instance;
}
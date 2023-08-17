import {IPersistenceManager} from "../iPersistenceManager";
import {
    AbstractMesh,
    Color3,
    DynamicTexture,
    InstancedMesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";

export class NewRelicData {
    private key: string;
    private account: string;
    private data: any[];
    private scene: Scene;
    private persistenceManager: IPersistenceManager;
    private policyLabels: AbstractMesh[] = [];

    constructor(persistenceManager: IPersistenceManager, scene: Scene) {
        this.persistenceManager = persistenceManager;
        this.scene = scene;
        this.persistenceManager.getNewRelicData()
            .then((data) => {
                this.data = data;
                this.getNewRelicData().then(() => {
                    this.drawGraph();
                });
            });
    }

    public setCredentials(key: string, account: string) {
        this.key = key;
        this.account = account;
    }

    public async clearData() {
        this.data = [];
        await this.persistenceManager.setNewRelicData(this.data);
    }

    public async getNewRelicData() {
        if (this.data && this.data.length > 0) {
            console.warn("Already have data, early return");
            return;
        }

        try {
            const res = await fetch('https://deepdiagram.com/.netlify/functions/nerdgraph', {
                method: 'POST',
                credentials: 'include',
                body: '{"query": "{actor { nrql(query: \\"select * from NrAiIncident  \\", accounts: ' + this.account + ') { results } } }"}',
                headers: {"Api-Key": this.key}
            });
            const data = await res.json();
            if (data?.data?.actor?.nrql?.results) {
                const newdata = data.data.actor.nrql.results.map((item: any) => {
                    item.id = item.incidentId;
                    item.policyName = item.policyName ? item.policyName : "No Policy";
                    return item
                });
                await this.persistenceManager.setNewRelicData(newdata);
                this.data = newdata;
            }
            console.log(JSON.stringify(data, null, 2));
        } catch (err) {
            console.log(err);
        }

    }

    public drawGraph() {
        this.data.sort((a, b) => {
            return parseInt(a.openTime) - parseInt(b.openTime);
        });

        const duration = this.data[this.data.length - 1].openTime - this.data[0].openTime;
        console.log(duration);
        const interval = 10 / duration;
        const first = parseInt(this.data[0].openTime);
        const material = new StandardMaterial("material", this.scene);
        material.diffuseColor = new Color3(0, 0, .7);
        material.alpha = .3;
        const baseMesh = MeshBuilder.CreateBox("baseItem", {width: 1, height: 1, depth: 1}, this.scene);
        baseMesh.material = material;

        const warningMaterial = new StandardMaterial("warningMaterial", this.scene);
        warningMaterial.diffuseColor = new Color3(.7, .7, .2);
        warningMaterial.alpha = .5;
        const warningMesh = MeshBuilder.CreateBox("warningItem", {width: 1, height: 1, depth: 1}, this.scene);
        warningMesh.material = warningMaterial;

        const criticalMaterial = new StandardMaterial("criticalMaterial", this.scene);
        criticalMaterial.diffuseColor = new Color3(.9, .2, .2);
        criticalMaterial.alpha = .7;
        const criticalMesh = MeshBuilder.CreateBox("criticalItem", {width: 1, height: 1, depth: 1}, this.scene);
        criticalMesh.material = criticalMaterial;


        const policies: Map<String, { x: number, y: number }> = new Map<string, { x: number, y: number }>();
        this.data.forEach((item) => {
            const policy = item.policyName ? item.policyName : "No Policy";
            let x = 0;
            let y: number = 0;
            if (policies.has(policy)) {
                const value = policies.get(policy);
                x = value.x;
                y = value.y + .105;
                policies.set(policy, {x, y});
            } else {
                policies.set(policy, {x: policies.size / 10, y: 0});
                x = policies.get(policy).x;
                const policyLabel = this.buildText(policy);
                policyLabel.scaling = new Vector3(3, 3, 3);
                policyLabel.position = new Vector3(x, .4, 0);
                policyLabel.rotation.x = Math.PI / 2;
                policyLabel.rotation.y = -Math.PI / 2;

                this.policyLabels.push(policyLabel);
            }
            const start = parseInt(item.openTime) - first;
            let end = duration;
            if (item.closeTime) {
                end = parseInt(item.closeTime) - first;
            }
            let box: AbstractMesh;
            switch (item.priority) {
                case "critical":
                    box = new InstancedMesh(item.id, criticalMesh);
                    break;
                case "warning":
                    box = new InstancedMesh(item.id, warningMesh);
                    break;
                default:
                    box = new InstancedMesh(item.id, baseMesh);
            }

            box.position = new Vector3(x, y + .5, (start * interval));
            if (item.closeTime) {
                box.scaling = new Vector3(.1, .1, (end - start) * interval);
            } else {
                box.scaling = new Vector3(.1, .1, .01);
            }
            box.position.z = box.position.z + box.scaling.z / 2;

            const startLabel = this.buildText(new Date(start + first).toLocaleString());
            startLabel.position = box.position.add(new Vector3(.05, .05, 0));
            startLabel.position.z = (start * interval) - .01;

            const endLabel = this.buildText(new Date(end + first).toLocaleString());
            endLabel.position = box.position.add(new Vector3(.05, .05, 0));
            endLabel.position.z = (end * interval) + .01;

        });

        this.scene.onBeforeRenderObservable.add(() => {
            this.policyLabels.forEach((label) => {
                label.position.z = this.scene.activeCamera.globalPosition.z;
            });
        });
    }

    private buildText(text: string) {
        //Set font
        const height = 0.03;
        const font_size = 24;
        const font = "bold " + font_size + "px Arial";
        //Set height for dynamic texture
        const DTHeight = 1.5 * font_size; //or set as wished
        //Calc Ratio
        const ratio = height / DTHeight;

        //Use a temporary dynamic texture to calculate the length of the text on the dynamic texture canvas
        const temp = new DynamicTexture("DynamicTexture", 32, this.scene);
        const tmpctx = temp.getContext();
        tmpctx.font = font;
        const DTWidth = tmpctx.measureText(text).width + 8;

        //Calculate width the plane has to be
        const planeWidth = DTWidth * ratio;

        //Create dynamic texture and write the text
        const dynamicTexture = new DynamicTexture("DynamicTexture", {
            width: DTWidth,
            height: DTHeight
        }, this.scene, false);
        const mat = new StandardMaterial("mat", this.scene);
        mat.diffuseTexture = dynamicTexture;
        dynamicTexture.drawText(text, null, null, font, "#000000", "#ffffff", true);

        //Create plane and set dynamic texture as material
        const plane = MeshBuilder.CreatePlane("text", {width: planeWidth, height: height}, this.scene);

        plane.material = mat;

        return plane;
    }
}
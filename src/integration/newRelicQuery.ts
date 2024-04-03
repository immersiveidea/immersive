import {Color3, Material, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";
import axios from "axios";
import {AdvancedDynamicTexture, TextBlock} from "@babylonjs/gui";

export class NewRelicQuery {
    private readonly scene: Scene;
    private data: { name: string, point: Vector3 }[] = [];
    private baseTransform: TransformNode;
    private seriesNumber = 0;
    private maxY = 0;
    private minY = 0;
    private maxZ = 0;
    private minZ = 0;

    constructor(scene: Scene) {
        this.scene = scene;
        this.baseTransform = new TransformNode("graphBase", this.scene);
    }

    public async getSales() {
        const data = await axios.get('/data.json')
        const series = data.data[0].series[0].series;
        for (const s of series) {
            this.buildSeries(s);
        }
        this.buildModel();

    }

    //private materials: Material[];
    private buildSeries(series) {
        const name = series.name;
        const material = new StandardMaterial(name + 'Material', this.scene);
        material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
        //material.ambientColor = new Color3(0, 0, 0);
        material.specularColor = new Color3(1, 1, 1);
        material.alpha = .9;


        //this.materials.push(material);
        const data = series.data;
        for (const point in data) {
            this.buildPoint(name, data[point]);

        }
        this.buildTextLabel(name, new Vector3(this.seriesNumber, .25, -.25));
        this.seriesNumber++;

    }

    private buildTextLabel(text: string, position: Vector3) {

        const plane = MeshBuilder.CreatePlane("plane", {width: .5, height: .25}, this.scene);
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane, 1024, 512, false);
        var text1 = new TextBlock();
        text1.text = text;
        advancedTexture.background = "#000000";
        text1.color = "white";
        text1.fontSize = 128;
        advancedTexture.addControl(text1);
        plane.position.set(position.x, position.y, position.z);
    }

    private buildNumericLabel(number: number, position: Vector3) {
        const rounded = Math.round(number);
        let shortNumber: string = '???';
        if (Math.log10(rounded) < 3) {
            shortNumber = rounded.toString();
        }
        if (Math.log10(rounded) >= 3 && Math.log10(rounded) < 6) {
            shortNumber = (Math.round(rounded / 100) / 10).toString() + 'K';
        }
        if (Math.log10(rounded) >= 6) {
            shortNumber = (Math.round(rounded / 100000) / 10).toString() + 'M';
        }
        this.buildTextLabel(shortNumber, position);
    }

    private buildModel() {
        const zScale = 20 / (this.maxZ - this.minZ);
        const yScale = 20 / (this.maxY - this.minY);
        for (const point of this.data) {
            const z = (point.point.z - this.minZ) * zScale;
            const y = (point.point.y - this.minY) * yScale;
            //const baseMesh = (this.scene.getMeshByName(point.name+ 'Mesh') as Mesh);
            const bar = MeshBuilder.CreateBox(name + 'Mesh', {width: 1, height: 1, depth: 1}, this.scene);
            bar.material = this.scene.getMaterialByName(point.name + 'Material');

            //const bar = new InstancedMesh(point.name + point.point.z, baseMesh);
            bar.scaling.x = .5;
            bar.scaling.y = y;
            bar.scaling.z = .5;
            /*MeshBuilder.CreateBox(point.name + point.point.z, {width: .5,
            height: y, depth: .5}, this.scene);
*/
            bar.position.set(point.point.x, y / 2, z);
            this.buildNumericLabel(point.point.y, new Vector3(point.point.x, y, z));
            const base = MeshBuilder.CreatePlane('base', {width: 20, height: 20}, this.scene);
            const material = new StandardMaterial("baseMaterial", this.scene);
            material.diffuseColor = new Color3(0, 1, 0);
            base.material = material;
            base.position.set(10, .001, 10);
            base.parent = this.baseTransform;
            base.rotation.x = Math.PI / 2;
            bar.parent = this.baseTransform;

            // bar.material = this.scene.getMaterialByName(point.name+'Material');
        }

    }

    private buildPoint(name, point) {
        if (point[1] > this.maxY) {
            this.maxY = point[1];
        }
        if (this.minY === 0 || point[1] < this.minY) {
            this.minY = point[1];
        }
        if (point[0] > this.maxZ) {
            this.maxZ = point[0];
        }
        if (this.minZ === 0 || point[0] < this.minZ) {
            this.minZ = point[0];
        }
        this.data.push({name: name, point: new Vector3(this.seriesNumber, point[1], point[0])});
    }
}
import {Angle, Color3, MeshBuilder, Scene, StandardMaterial, Texture} from "@babylonjs/core";
import axios from "axios";

export class Cameras {
    private readonly scene: Scene;
    private token: string;
    private cameras;
    private cameratextures = new Array<Texture>();

    constructor(scene: Scene, token: string) {
        this.scene = scene;
        this.token = token;
    }

    public async getCameras() {
        this.cameras =  await axios.get('https://local.immersiveidea.com/api/cameras');
    }

    public createCameras() {
        this.createCamera(12333524, 0);
        this.createCamera(115860395, 1);
        this.createCamera(115855810, 2);
        this.createCamera(99677736, 3);
        this.createCamera(48497021, 4);
        this.createCamera(55870327, 5);
    }

    public createCamera(id, index) {
        const width = 1.6;
        const height = .9
        const plane = MeshBuilder.CreatePlane("plane", {width: width, height: height}, this.scene);
        const materialPlane = new StandardMaterial("texturePlane", this.scene);
        const imageText = new Texture("https://local.immersiveidea.com/api/cameras?id=" + id, this.scene);

        materialPlane.diffuseTexture = new Texture("https://local.immersiveidea.com/api/cameras?id=" + id, this.scene);
        materialPlane.specularColor = new Color3(0, 0, 0);
        materialPlane.backFaceCulling = false;
        plane.material = materialPlane;
        plane.rotation.y = Angle.FromDegrees(180).radians();
        plane.position.y = height / 2 + .2;
        plane.position.z = -3;
        plane.position.x = (width * 3) - (index * width);
        this.cameratextures.push(imageText);

    }
}

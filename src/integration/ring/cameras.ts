import {Angle, Color3, MeshBuilder, Scene, StandardMaterial, Texture} from "@babylonjs/core";
import axios from "axios";

export class Cameras {
    private scene: Scene;
    private cameras;
    constructor(scene: Scene) {
        this.scene = scene;
    }
    public async getCameras() {

        const cameras = await axios.get('/api/cameras',{});
        this.cameras = cameras;
        console.log(cameras);
    }
    public createCameras() {
        this.createCamera(12333524, 0);
        this.createCamera( 115860395, 1);
        this.createCamera( 115855810, 2);
        this.createCamera( 99677736, 3);
        this.createCamera( 48497021, 4);
        this.createCamera( 55870327, 5);
    }
    public createCamera(id, index) {

            const plane = MeshBuilder.CreatePlane("plane", {width: 1.6, height:.9}, this.scene);
            const materialPlane = new StandardMaterial("texturePlane", this.scene);
            materialPlane.diffuseTexture = new Texture("/api/cameras?id=" + id, this.scene);
            materialPlane.specularColor = new Color3(0, 0, 0);
            materialPlane.backFaceCulling = false;//Allways show the front and the back of an element
            plane.material = materialPlane;
            plane.rotation.y = Angle.FromDegrees(180).radians();
            plane.position.y = 1.5;
            plane.position.z = -5;
            plane.position.x = (1.6*3) - (index * 1.6);

    }
}
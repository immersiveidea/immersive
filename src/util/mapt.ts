import * as maptilerClient from '@maptiler/client';
import {Angle, Color3, MeshBuilder, Scene, StandardMaterial, Texture} from "@babylonjs/core";

export class Mapt {
    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    buildMapImage() {

        maptilerClient.config.apiKey = '073I3Pfe4lzoSf8tNriR';

        const link = maptilerClient.staticMaps.centered(
            [-88.8711198, 42.3370588],
            14,
            {width: 2048, height: 2048, style: 'streets-v2'}
        );
        const plane = MeshBuilder.CreatePlane("plane", {width: 10, height: 10}, this.scene);
        const materialPlane = new StandardMaterial("texturePlane", this.scene);
        const sphere = MeshBuilder.CreateSphere("cams", {diameter: .1}, this.scene);
        sphere.position.y = 0.2;
        sphere.position.z = -5;
        const sphereMaterial = new StandardMaterial("sphere", this.scene);
        sphereMaterial.diffuseColor = Color3.Blue();
        sphereMaterial.ambientColor = Color3.Blue();

        sphere.visibility = 0.8;

        materialPlane.diffuseTexture =
            new
            Texture(link,
                this.scene);
        materialPlane.specularColor = new Color3(0, 0, 0);
        materialPlane.backFaceCulling = false;//Allways show the front and the back of an element
        plane.material = materialPlane;
        plane.rotation.x = Angle.FromDegrees(90).radians();
        plane.rotation.y = Angle.FromDegrees(180).radians();
        plane.position.y = 0.1;
        plane.position.z = -5;

    }

}
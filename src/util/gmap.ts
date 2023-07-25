import {Angle, Color3, MeshBuilder, Scene, StandardMaterial, Texture} from "@babylonjs/core";
import googleStaticMapsTile from "google-static-maps-tile";

export class Gmap {
    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public async createMapTiles(lat, lon) {
        googleStaticMapsTile({
            areaSize: '2560x2560',
            center: '26.443397,-82.111512',
            zoom: 12,
            imagePerLoad: 50,
            durationBetweenLoads: 60 * 1000 + 100,
            key: 'AIzaSyD4jJCYcIvHDEiOkVxC2c4zNYRqZKYHMMk',
            maptype: 'satellite'
        })
            .on('progress', function (info) {
                //console.log(info.count);
                //console.log(info.total);
                const image = info.image;

                image.style.position = 'absolute';
                image.style.left = info.data.x + 'px';
                image.style.top = info.data.y + 'px';
                document.body.appendChild(image);
            });
    }

    public createMap(lat, lon) {
        //const lat = 42.3369513;
        //const lon = -88.8707076;

        const plane = MeshBuilder.CreatePlane("plane", {width: 1, height: 1}, this.scene);
        const materialPlane = new StandardMaterial("texturePlane", this.scene);
        const zoom = 10;


        materialPlane.diffuseTexture =
            new
            Texture(`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=640x640&key=AIzaSyD4jJCYcIvHDEiOkVxC2c4zNYRqZKYHMMk`,
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

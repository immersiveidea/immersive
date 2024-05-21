import {Color3, DynamicTexture, MeshBuilder, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import log, {Logger} from "loglevel";
import {MaptilerMap} from "../objects/maptilerMap";

export class CameraMenu {
    private readonly scene: Scene;
    private readonly logger: Logger = log.getLogger('CameraMenu');

    constructor(scene) {
        this.scene = scene;
        //this.buildMenu(3, new Vector3(-1, 2, 0));
        //this.buildMenu(4, new Vector3(0,2,0));
        //this.buildMenu(5, new Vector3(1,2,0));
        //this.buildMenu(6, new Vector3(2,2,0));
        //this.buildIcon();
        //this.loadIcon();

        this.buildMap();

    }

    private buildMap() {
        const maptilerMap = new MaptilerMap('YnvhjBiU8oCWP0GXNdHL', this.scene, 'map-node', 3);
        maptilerMap.node.position.y = 1;
        maptilerMap.node.position.z = -4;
        maptilerMap.node.rotation.y = Math.PI;
        maptilerMap.node.rotation.x = Math.PI / 6;
        maptilerMap.node.scaling = new Vector3(1, 1, 1);
        //maptilerMap.setLocation('loves park, il' , 15);
        maptilerMap.setLocation('rockford, il', 12).then(() => {
            maptilerMap.plotPoint(42.33181896128866, -88.86844896012006);
        });

    }

    //https://maps.geoapify.com/v1/staticmap?style=osm-carto&scaleFactor=2&width=4096&height=4096&center=lonlat:-89.0940,42.2711&zoom=12.4318&apiKey=d548c5ed24604be6a9dd0d989631f783
    private buildIcon() {
        const icon = MeshBuilder.CreatePlane('camera-icon', {width: .1, height: .1}, this.scene);
        icon.position = new Vector3(0, 3, 0);
        icon.metadata = {grabbable: true};
        const material = new StandardMaterial('icon-material', this.scene);

        material.backFaceCulling = false;
        const texture = new DynamicTexture('icon-texture', {width: 256, height: 256}, this.scene);
        //const texture = new DynamicTexture('/assets/icons/video.png', this.scene);

        const image = new Image();
        //image.setAttribute('width', '256');
        //image.setAttribute('height', '256');
        //image.width=32;
        //image.height=32;
        image.src = '/assets/icons/video.png';
        image.onload = () => {
            texture.getContext().drawImage(image, 0, 0);
            texture.update();
        }

        material.emissiveColor = new Color3(.1, .1, .8);
        material.opacityTexture = texture;
        icon.material = material;
        material.disableLighting = true;

        //material.diffuseTexture = texture;
        //material.disableLighting;
        //material.emissiveColor = new Color3(1, 1, 1);
        //texture.uScale = 1;
        //texture.vScale = 1;


    }
    private buildMenu(camnum: number, position: Vector3) {
        const camerasphere = MeshBuilder.CreatePlane('camera-' + camnum, {width: 1, height: 1}, this.scene);
        camerasphere.position = position;
        const material = new StandardMaterial("cameramaterial", this.scene);
        //material.emissiveColor = new Color3(1, 1, 1);
        material.backFaceCulling = false;
        const texture = new DynamicTexture('texture', {width: 1600, height: 1600}, this.scene);
        material.emissiveTexture = texture;
        material.disableLighting = true;
        const img = new Image();

        img.setAttribute('crossorigin', 'anonymous');
        img.src = 'https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=' + camnum;

        const ctx = texture.getContext();
        img.onload = () => {

            ctx.drawImage(img, 0, 0);
            texture.update();
            window.setInterval((texture, img, ctx) => {
                ctx.drawImage(img, 0, 0);
                texture.update();
            }, 1000, texture, img, ctx);
        }

        texture.onLoadObservable.add(() => {
            this.logger.debug('texture loaded');
        });
        camerasphere.material = material;
        this.logger.info('camera built');
    }
}
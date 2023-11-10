import {Color3, DynamicTexture, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3} from "@babylonjs/core";
import log, {Logger} from "loglevel";

export class CameraMenu {
    private readonly scene: Scene;
    private xr;
    private controllers;
    private readonly logger: Logger = log.getLogger('CameraMenu');

    constructor(scene, xr, controllers) {
        this.scene = scene;
        this.xr = xr;
        this.controllers = controllers;
        this.buildMenu(1, new Vector3(0, 1, 0));
        //this.buildMenu(4, new Vector3(0,2,0));
        //this.buildMenu(5, new Vector3(1,2,0));
        //this.buildMenu(6, new Vector3(1,1,0));

    }

    private buildMenu(camnum: number, position: Vector3) {
        const camerasphere = MeshBuilder.CreateSphere("camerasphere", {
            diameter: 10,
            slice: .5,
            sideOrientation: Mesh.DOUBLESIDE
        }, this.scene);
        camerasphere.position = position;
        const material = new StandardMaterial("cameramaterial", this.scene);
        material.emissiveColor = new Color3(1, 1, 1);

        const texture = new DynamicTexture('texture', {width: 1600, height: 1600}, this.scene);
        material.diffuseTexture = texture;
        const img = new Image();
        img.src = 'https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=' + camnum + '&timestamp=1698497537140';
        const ctx = texture.getContext();
        img.onload = () => {
            ctx.drawImage(img, 250, 0, 2112, 1940, 0, 0, 1600, 1600);
            texture.update();
            window.setInterval((texture, img, ctx) => {
                ctx.drawImage(img, 250, 0, 2112, 1940, 0, 0, 1600, 1600);
                texture.update();
            }, 60, texture, img, ctx);
        }

        texture.onLoadObservable.add(() => {
            this.logger.debug('texture loaded');
        });
        camerasphere.material = material;
        this.logger.info('camera built');
    }
}
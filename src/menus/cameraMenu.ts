import {Color3, DynamicTexture, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3} from "@babylonjs/core";

export class CameraMenu {
    private scene: Scene;
    private xr;
    private controllers;

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
        //const camerasphere = MeshBuilder.CreatePlane("camerasphere", {width: 1.6, height: .6, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
        camerasphere.position = position;
        const material = new StandardMaterial("cameramaterial", this.scene);
        material.emissiveColor = new Color3(1, 1, 1);
        //camerasphere.rotation.z = Math.PI;
        /*const texture = new VideoTexture("video",
            'https://local.immersiveidea.com/',
            this.scene);
*/

        //const texture = new DynamicTexture("dynamic texture", {width: 512, height: 256}, this.scene, false);
        const texture = new DynamicTexture('texture', {width: 1600, height: 1600}, this.scene);
        //const img = document.createElement('img');
        //document.body.append(img);
        //img.width=2592;
        //img.height=1944;

        material.diffuseTexture = texture;
        const img = new Image();
        img.src = 'https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=' + camnum + '&timestamp=1698497537140';
        const ctx = texture.getContext();
        img.onload = () => {
            ctx.drawImage(img, 250, 0, 2112, 1940, 0, 0, 1600, 1600);
            texture.update();
            window.setInterval((texture, img, ctx) => {
                //const start = new Date();
                ctx.drawImage(img, 250, 0, 2112, 1940, 0, 0, 1600, 1600);
                texture.update();
                //console.log(new Date() - start);
            }, 60, texture, img, ctx);
        }
        //https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=1&timestamp=1698497537140');

        //texture.getContext().drawImage(img, 0,0);


        texture.onLoadObservable.add(() => {
            console.log('texture loaded');
        });
        this.scene.onAfterRenderObservable.add(() => {
            // texture._rebuild();
        }, 1, true, this);
        camerasphere.material = material;
        /*texture.video.play().then(() => {
            console.log('video playing');
        }).catch((err) => {
            console.log(err);
            console.log("here");
        });
          */
        console.log('video loaded');
        //Material.diffuseColor = new Color3(0, 0, 0);

        //https://cameras.immersiveidea.com/mjpg/video.mjpg?camera=1&resolution=2592x1944&compression=30&mirror=0&rotation=0&textsize=medium&textposition=top&textbackgroundcolor=black&textcolor=white&text=0&clock=0&date=0&overlayimage=0&fps=0&videokeyframeinterval=13&videobitrate=0&maxframesize=0&timestamp=1698491710423
    }
}
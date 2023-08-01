import {
    Angle,
    Color3,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
    WebXRSessionManager
} from "@babylonjs/core";
import log from "loglevel";


export class Cameras {
    private readonly scene: Scene;
    private readonly logger = log.getLogger('bmenu');

    private xrSession: WebXRSessionManager;
    private startPosition = new Vector3(0, 0, 0);

    constructor(scene: Scene, xrSession: WebXRSessionManager) {
        this.scene = scene;
        this.xrSession = xrSession;

    }

    public createCameras(position: Vector3) {
        this.startPosition = position;
        this.getCameras();
    }

    private getCameras() {

    }

    private async createCamera() {
        const width = 1.6;
        const height = .9
        const plane = MeshBuilder.CreatePlane("plane", {width: width, height: height}, this.scene);
        const materialPlane = new StandardMaterial("texturePlane", this.scene);
        //const photo = []
        //await cam.getSnapshot();
        //const textureBlob = new Blob([photo], {type: 'image/jpeg'});
        //const textureUrl = URL.createObjectURL(textureBlob);
        const imageText = new Texture("", this.scene);

        materialPlane.diffuseTexture = imageText;
        materialPlane.specularColor = new Color3(0, 0, 0);
        materialPlane.backFaceCulling = false;
        plane.material = materialPlane;
        plane.rotation.y = Angle.FromDegrees(180).radians();
        plane.position.y = height / 2 + .2;
        plane.position.z = -3;
        plane.position.x = (width * 3) + this.startPosition.x;
        this.startPosition.x += 3;
    }
}

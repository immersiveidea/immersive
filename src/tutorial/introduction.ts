import log from "loglevel";
import {
    AbstractMesh,
    ActionEvent,
    Color3,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3,
    VideoTexture
} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";
import {HtmlButton} from "../../../babylon-html";
import Hls from "hls.js";

const logger = log.getLogger('Introduction');
export class Introduction {
    private readonly _scene: Scene;
    private videoElement: HTMLVideoElement;

    constructor() {
        logger.info('Introduction constructor');
        this._scene = DefaultScene.Scene;
        this.initialize();
    }

    buildVideo(src: string, position: Vector3): AbstractMesh {
        const vid = document.createElement("video");
        this.videoElement = vid;
        vid.setAttribute('autoplay', 'true');
        vid.setAttribute('playsinline', 'true');
        vid.setAttribute('src', src);

        const texture = new VideoTexture("video", vid, this._scene, true);
        const mesh = this.makeObject("video", position);
        const material = new StandardMaterial("video_material", this._scene);
        material.diffuseTexture = texture;
        material.diffuseColor = new Color3(1, 1, 1);
        material.emissiveColor = new Color3(1, 1, 1);
        mesh.material = material;
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(vid);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                vid.play().then(() => {
                    this.logger.debug("Video Playing");
                });
            });
        } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
            vid.src = src;
            vid.addEventListener('loadedmetadata', function () {
                vid.play().then(() => {

                });
            });
        }
        //document.body.appendChild(vid);
        mesh.metadata = {video: vid};
        return mesh;
    }

    private initialize() {
        /*
        const talkTrack = new Sound("talkTrack", "assets/sounds/introTalkTrack.mp3", this._scene, () => {
            this.ready();
        }, {
            loop: false,
            autoplay: false,
            volume: 1
        });*/
        this.ready();
    }

    private ready() {
        const startButton = this.buildButton('Begin Tutorial');
        startButton.onPointerObservable.add((eventData: ActionEvent) => {
            if (eventData.sourceEvent.type === "pointerup") {
                this.start(startButton);
            }
        }, -1, true, this, false);

    }

    private buildButton(name: string): HtmlButton {
        const button = new HtmlButton(name, name, this._scene, null,
            {html: null, image: {width: 512, height: 512}, width: .5, height: .5});
        button.transform.position.y = .4;
        return button;
    }

    private start(prev: HtmlButton) {
        prev.dispose();
        const controllerButton = this.buildButton('Controllers');
        const video = this.buildVideo('https://customer-l4pyjzbav11fzy04.cloudflarestream.com/8b906146c75bb5d81e03d199707ed0e9/manifest/video.m3u8', new Vector3(0, 1.8, -.5));
        controllerButton.onPointerObservable.add((eventData: ActionEvent) => {
            if (eventData.sourceEvent.type === "pointerup") {
                this.controllers(controllerButton, video);
            }
        }, -1, true, this, false);

    }

    private controllers(prev: HtmlButton, prevVideo: AbstractMesh) {
        if (prevVideo.metadata) {
            prevVideo.metadata.video.pause();
            prevVideo.metadata.video.remove();
            prevVideo.dispose();
        }
        prev.dispose();
        const controllerButton = this.buildButton('Controllers 2');
        const video = this.buildVideo('https://customer-l4pyjzbav11fzy04.cloudflarestream.com/8b906146c75bb5d81e03d199707ed0e9/manifest/video.m3u8', new Vector3(0, 1.8, -.5));
    }

    private showVideo(url: string) {

    }

    private makeObject(text: string, position: Vector3): AbstractMesh {
        const videoScale = 2.8;
        const video = MeshBuilder.CreatePlane(text + "_plane", {width: 1.6, height: .9}, this._scene);
        video.rotation.y = Math.PI;
        video.scaling.set(videoScale, videoScale, videoScale);
        video.position = position;
        return video;
    }
}
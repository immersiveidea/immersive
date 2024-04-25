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
import {Spinner} from "../objects/spinner";

type Step = {
    name: string;
    video?: string;
}
const steps: Array<Step> = [
    {
        'name': 'Introduction',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/67c6fbbfba87cfaf689494953f6c4966/manifest/video.m3u8'
    },
    {
        'name': 'Entering VR',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/1aee90d213aaad1c9ef2fbfc857262b9/manifest/video.m3u8'
    },
    {
        'name': 'Basic Navigation',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/db06343306521b5d1503b7ecf5b511b0/manifest/video.m3u8'
    },
    {
        'name': 'Creating Objects',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/9d41c70d12cba2edde99f9c45f135d8c/manifest/video.m3u8'
    },
    {
        'name': 'Editing Objects',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/a4a019386c0c15c812ac7d445fe6bdfc/manifest/video.m3u8'
    },
    {
        'name': 'Resizing Objects',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/440484fd4a6a17848a09fc2117dbcbf6/manifest/video.m3u8'
    },
    {
        'name': 'Changing Settings',
        'video': 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/8347e2b96d6e3f9a66007d48bb8ddeea/manifest/video.m3u8'
    },
    {'name': 'Done', 'video': null}

]
const logger = log.getLogger('Introduction');
export class Introduction {
    private readonly _scene: Scene;
    private videoElement: HTMLVideoElement;
    private spinner: Spinner;
    constructor() {
        this.spinner = new Spinner();
        this.spinner.show();
        logger.info('Introduction constructor');
        this._scene = DefaultScene.Scene;
        this.initialize();
    }

    buildVideo(src: string, position: Vector3): AbstractMesh {
        const vid = document.createElement("video");
        this.videoElement = vid;
        vid.setAttribute('autoplay', 'true');
        vid.setAttribute('playsinline', 'true');
        vid.setAttribute('loop', 'false');
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
                vid.loop = false;
                vid.play().then(() => {
                    logger.debug("Video Playing");
                });
            });
        } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
            vid.src = src;
            vid.loop = false;
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
        const controllerButton = this.buildButton('Tutorial');
        controllerButton.onPointerObservable.add((eventData: ActionEvent) => {
            if (eventData.sourceEvent.type === "pointerup") {
                this.step(0, controllerButton, null);
            }
        }, -1, true, this, false);
    }

    private buildButton(name: string): HtmlButton {
        const button = new HtmlButton(name, name, this._scene, null,
            {html: null, image: {width: 512, height: 512}, width: .5, height: .5});
        button.transform.position.y = .4;
        return button;
    }


    private step(index: number, prev?: HtmlButton, prevVideo?: AbstractMesh) {
        if (prevVideo && prevVideo?.metadata) {
            prevVideo.metadata.video.pause();
            prevVideo.metadata.video.remove();
            prevVideo.dispose();
        }
        if (prev) {
            prev.dispose();
        }
        if (index < steps.length) {
            const controllerButton = this.buildButton(steps[index].name);
            if (steps[index].video) {
                const video = this.buildVideo(steps[index].video, new Vector3(0, 1.8, -.5));
                controllerButton.onPointerObservable.add((eventData: ActionEvent) => {
                    if (eventData.sourceEvent.type === "pointerup") {
                        this.step(index + 1, controllerButton, video);
                    }
                }, -1, true, this, false);
            } else {
                controllerButton.onPointerObservable.add((eventData: ActionEvent) => {
                    if (eventData.sourceEvent.type === "pointerup") {
                        localStorage.setItem('tutorialCompleted', 'true');
                        controllerButton.dispose();
                    }
                }, -1, true, this, false);
            }

        }
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
import {
    AbstractMesh,
    Color3,
    DynamicTexture,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsHelper,
    PhysicsShapeType,
    Scene,
    StandardMaterial,
    Vector3,
    VideoTexture
} from "@babylonjs/core";
import {Button3D, GUI3DManager, TextBlock} from "@babylonjs/gui";
import {DiaSounds} from "../util/diaSounds";
import {AppConfig} from "../util/appConfig";
import Hls from "hls.js";
import log, {Logger} from "loglevel";


export class Introduction {
    private readonly scene: Scene;
    private manager: GUI3DManager;
    private physicsHelper: PhysicsHelper;
    private current: AbstractMesh[] = [];
    private step: number = 0;
    private items: AbstractMesh[] = [];
    private advance: Button3D;
    private sounds: DiaSounds;
    private config: AppConfig;
    private logger: Logger = log.getLogger('Introduction');

    private videoElement: HTMLVideoElement;

    constructor(scene: Scene, config: AppConfig) {
        this.sounds = new DiaSounds(scene);
        this.scene = scene;
        this.config = config;
        this.manager = new GUI3DManager(scene);
        this.physicsHelper = new PhysicsHelper(scene);

        this.scene.onReadyObservable.add(() => {
            setTimeout((s) => {
                s.start()
            }, 2000, this);
        });

    }

    public start() {
        this.scene.physicsEnabled = true;
        this.manager.controlScaling = .5;
        this.advance = new Button3D("advance");

        const text = new TextBlock("advance", "Click Me");
        text.fontSize = "48px";
        text.color = "#ffffff";
        text.alpha = 1;
        this.advance.content = text;

        this.advance.onPointerClickObservable.add(() => {
            this.takeStep();
        }, -1, false, this, false);
        this.manager.addControl(this.advance);
        this.advance.isVisible = false;

        this.scene.onReadyObservable.add(() => {
            this.advance.isVisible = true;
            this.advance.node.position = new Vector3(0, .2, -1);
            this.advance.node.rotation = new Vector3(0, Math.PI, 0);
        });
    }

    buildVideo(src: string, size: number, position: Vector3): AbstractMesh {
        const vid = document.createElement("video");
        this.videoElement = vid;
        vid.setAttribute('autoplay', 'true');
        vid.setAttribute('playsinline', 'true');


        vid.setAttribute('src', src);
        const texture = new VideoTexture("video", vid, this.scene, true);

        const mesh = this.makeObject("video", position, size, 16 / 9);
        const material = new StandardMaterial("video_material", this.scene);

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
                    console.log("Video Playing");
                });
            });
        }
        return mesh;
    }

    makeObject(text: string, position: Vector3, size: number, ratio: number = 2): AbstractMesh {
        const welcome = MeshBuilder.CreateTiledBox(text + "_box", {width: 1, height: 1, depth: 1}, this.scene);
        welcome.position = position;
        welcome.scaling = new Vector3(size, size / ratio, size);

        const aggregate = new PhysicsAggregate(welcome, PhysicsShapeType.BOX, {
            friction: 1,
            mass: 1,
            restitution: .1
        }, this.scene);
        aggregate.body.getCollisionObservable().add((collider) => {
            if (collider.impulse < .5) {
                return;
            }
            let volume = 0;
            const sound = this.sounds.bounce;
            if (collider.impulse > 1 && collider.impulse < 10) {
                volume = collider.impulse / 10;
            }
            if (volume > 0) {
                sound.attachToMesh(aggregate.body.transformNode);
                sound.updateOptions({offset: 0, volume: volume, length: .990});

                sound.play();
            }
        });
        aggregate.body.setCollisionCallbackEnabled(true);

        return welcome;
    }

    buildText(text: string, size: number, textureSize: number, position: Vector3): AbstractMesh {
        const mesh = this.makeObject(text, position, size);
        const texture = new DynamicTexture("dynamic texture", {
            width: textureSize,
            height: textureSize / 2
        }, this.scene, true);
        texture.drawText(text, null, null, "bold 128px Arial", "white", "#00f", true, true);
        mesh.material = new StandardMaterial(text + "_material", this.scene);
        mesh.material.alpha = 1;
        (mesh.material as StandardMaterial).diffuseTexture = texture;
        texture.update();
        return mesh;
    }

    private takeStep() {
        this.current.forEach((mesh) => {
            const pos = mesh.physicsBody.transformNode.absolutePosition.clone();
            pos.x = pos.x - .1;
            mesh.physicsBody.applyImpulse(new Vector3(0, 10, -12), pos);
        });

        switch (this.step) {
            case 0:
                this.items.push(this.buildText("Welcome To", 3, 1024, new Vector3(0, 15, -4)));
                this.items.push(this.buildText("Deep Diagram", 5, 1024, new Vector3(0, 10, -4)));
                this.current = this.items.slice(-2);
                break;
            case 1:
                this.items.push(this.buildText("Let us show you", 3, 1024, new Vector3(2, 16, -5)));
                this.items.push(this.buildText("what you can build", 4, 1200, new Vector3(-1.6, 12, -5)));
                this.current = this.items.slice(-2);
                break;
            case 2:
                this.items.push(this.buildText("A quick video", 5, 1024, new Vector3(0, 15, -5)));
                this.current = this.items.slice(-1);
                break;
            case 3:

                const src = 'https://customer-l4pyjzbav11fzy04.cloudflarestream.com/8b906146c75bb5d81e03d199707ed0e9/manifest/video.m3u8'
                this.items.push(this.buildVideo(src, 7, new Vector3(0, 15, -6)));
                this.current = this.items.slice(-1);
                break;
            case 4:
                this.items.forEach((mesh) => {
                    mesh.physicsBody.dispose();
                    mesh.dispose();
                });
                this.advance.dispose();
                this.manager.dispose();
                this.config.setDemoCompleted(true);
                this.items = [];
                if (this.videoElement) {
                    this.videoElement.pause();
                    this.videoElement.remove();
                    this.videoElement = null;
                }
        }
        this.step++;

    }

}
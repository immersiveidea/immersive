import {
    GroundMesh,
    MeshBuilder,
    Observable,
    PBRMetallicRoughnessMaterial,
    PhotoDome,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Sound,
    Texture,
    Vector3
} from "@babylonjs/core";
import {CustomPhysics} from "./customPhysics";
import {DiaSounds} from "./diaSounds";
import {AppConfig} from "./appConfig";


export class CustomEnvironment {
    private readonly scene: Scene;
    private readonly name: string;
    private readonly _groundMeshObservable: Observable<GroundMesh> = new Observable<GroundMesh>();

    constructor(scene: Scene, name: string = "default", config: AppConfig) {
        this.scene = scene;
        this.name = name;
        const physics = new CustomPhysics(this.scene, config);
        physics
            .initializeAsync()
            .then(() => {
                const ground = this.createGround();
                this._groundMeshObservable.notifyObservers(ground);
            });
        const photo = new PhotoDome('sky',
            '/assets/textures/outdoor_field2.jpeg', {},
            scene);
        try {
            const sounds = new DiaSounds(scene);
            window.setTimeout((sound) => {
                sound.play()
            }, 2000, sounds.background);
            const effects: Array<Sound> = sounds.backgroundEffects;
            window.setInterval((sounds: Array<Sound>) => {
                if (Math.random() < .5) {
                    return;
                }
                const sound = Math.floor(Math.random() * sounds.length);
                const x = Math.floor(Math.random() * 20) - 10;
                const z = Math.floor(Math.random() * 20) - 10;

                const position = new Vector3(x, 0, z);
                if (sounds[sound].isPlaying) {

                } else {
                    sounds[sound].setPosition(position);
                    sounds[sound].setVolume(Math.random() * .3);
                    sounds[sound].play();
                }

            }, 2000, effects);
        } catch (error) {
            console.log(error);
        }


    }

    public get groundMeshObservable() {
        return this._groundMeshObservable;
    }

    private createGround() {
        const scene = this.scene;
        const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
        const gText = new Texture("/assets/textures/grass1.jpeg", scene);
        gText.uScale = 40;
        gText.vScale = 40;
        groundMaterial.baseTexture = gText;
        groundMaterial.metallic = 0;
        groundMaterial.roughness = 1;

        const ground: GroundMesh = MeshBuilder.CreateGround("ground", {
            width: 100,
            height: 100,
            subdivisions: 1
        }, scene);

        ground.material = groundMaterial;
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);
        return ground;
    }
}
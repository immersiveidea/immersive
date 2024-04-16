import {
    Color3,
    GroundMesh,
    HemisphericLight,
    Material,
    MeshBuilder,
    Observable,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    PointsCloudSystem,
    Scene,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {CustomPhysics} from "./customPhysics";
import {AppConfig} from "./appConfig";
import {GridMaterial} from "@babylonjs/materials";


export class CustomEnvironment {
    private readonly scene: Scene;
    private readonly name: string;
    private readonly _groundMeshObservable: Observable<GroundMesh> = new Observable<GroundMesh>();

    constructor(scene: Scene, name: string = "default", config: AppConfig) {
        this.scene = scene;
        this.name = name;
        const loading = document.querySelector('#loadingGrid');
        if (loading) {
            loading.remove();
        }
        const light = new HemisphericLight("light1", new Vector3(1, 2, 1), scene);
        light.groundColor = new Color3(.1, .1, .1)
        light.diffuse = new Color3(1, 1, 1);
        light.intensity = .8;

        const physics = new CustomPhysics(this.scene, config);
        physics
            .initializeAsync()
            .then(() => {
                const ground = this.createGround();
                this._groundMeshObservable.notifyObservers(ground);
            });
    }

    private initSounds() {
        /* try {
            const sounds = new DiaSounds(this.scene);
            window.setTimeout((sound) => {
                sound.play()
            }, 2000, sounds.background);
            const effects: Array<Sound> = sounds.backgroundEffects;

            window.setInterval((sounds: Array<Sound>) => {
                if (Math.random() < .5) {
                    return;
                }
                const MAX_DISTANCE = 40;
                const sound = Math.floor(Math.random() * sounds.length);
                const x = (Math.random() * MAX_DISTANCE) - (MAX_DISTANCE / 2);
                const y = Math.random() * (MAX_DISTANCE / 2);
                const z = (Math.random() * MAX_DISTANCE) - (MAX_DISTANCE / 2);

                const position = new Vector3(x, y, z);
                if (sounds[sound].isPlaying) {

                } else {
                    sounds[sound].setPosition(position);
                    sounds[sound].setVolume(Math.random() * .3);
                    sounds[sound].play();
                }

            }, 2000, effects);
        } catch (error) {

        }

             */
    }
    public get groundMeshObservable() {
        return this._groundMeshObservable;
    }

    private createGround() {
        const scene = this.scene;

        const ground: GroundMesh = MeshBuilder.CreateGround("ground", {
            width: 20,
            height: 20,
            subdivisions: 1
        }, scene);
        createPoints(scene, 20, 20);
        ground.material = createGridMaterial(scene, Color3.FromHexString("#aaffaa"), Color3.FromHexString("#111511"));
        const color1 = Color3.FromHexString("#ff9999");
        const color2 = Color3.FromHexString("#221111");
        const color3 = Color3.FromHexString("#9999ff");
        const color4 = Color3.FromHexString("#111115");


        this.createWall(new Vector3(0, 10, 10), new Vector3(0, 0, 0), color3, color4);
        this.createWall(new Vector3(0, 10, -10), new Vector3(0, Math.PI, 0), color3, color4);
        this.createWall(new Vector3(10, 10, 0), new Vector3(0, Math.PI / 2, 0), color1, color2);
        this.createWall(new Vector3(-10, 10, 0), new Vector3(0, -Math.PI / 2, 0), color1, color2);

        new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);
        //buildAvatar(scene);
        return ground;
    }

    private createWall(position: Vector3, rotation: Vector3, color1: Color3, color2: Color3) {
        const scene = this.scene;
        const wall = MeshBuilder.CreatePlane("wall", {width: 20, height: 20}, scene);
        wall.position = position;
        wall.rotation = rotation;
        wall.material = createGridMaterial(scene, color1, color2);
        return wall;
    }
}

async function createPoints(scene: Scene, divisions: number = 10, scale: number = 80) {
    const half = .5;
    const increment = 1 / divisions;
    let x = -half;
    let y = -half;
    let z = -half;
    const baseTransform = new TransformNode("baseTransform", scene);
    baseTransform.scaling = new Vector3(scale, scale, scale);
    baseTransform.position = new Vector3(0, scale / 2, 0);
    const pcs = new PointsCloudSystem("pcs", 1, scene);

    pcs.addPoints((divisions + 1) ** 3, function (particle) {
        particle.position.x = x;
        particle.position.y = y;
        particle.position.z = z;

        x += increment;
        if (x > half) {
            x = -half
            y += increment;
            if (y > half) {
                y = -half;
                z += increment;
                if (z > half) {

                }
            }
        }
    });
    const mesh = await pcs.buildMeshAsync();
    mesh.visibility = .5;
    mesh.parent = baseTransform;
}

function createGridMaterial(scene: Scene, lineColor: Color3, mainColor: Color3): Material {
    const material = new GridMaterial("gridMaterial", scene);
    material.minorUnitVisibility = .1;
    material.gridRatio = .1;
    material.majorUnitFrequency = 10;
    material.mainColor = mainColor;
    material.lineColor = lineColor;

    return material;
}

function createGrassGround(scene: Scene): Material {
    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    const gText = new Texture("/assets/textures/grass1.jpeg", scene);
    gText.uScale = 10;
    gText.vScale = 10;
    groundMaterial.albedoTexture = gText;
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 1;
    const grassBump = new Texture("/assets/textures/grassnormal.png", scene);
    grassBump.uScale = 20;
    grassBump.vScale = 20;
    groundMaterial.bumpTexture =
        grassBump;
    return groundMaterial;
}
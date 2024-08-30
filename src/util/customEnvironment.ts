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
    Sound,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {CustomPhysics} from "./customPhysics";
import {AppConfig} from "./appConfig";
import {GridMaterial} from "@babylonjs/materials";
import {DefaultScene} from "../defaultScene";


export class CustomEnvironment {
    private readonly scene: Scene;
    private readonly name: string;
    private readonly _groundMeshObservable: Observable<GroundMesh> = new Observable<GroundMesh>();

    constructor(name: string = "default", config: AppConfig) {
        this.scene = DefaultScene.Scene;
        this.name = name;

        this.scene.ambientColor = new Color3(.1, .1, .1);
        const light = new HemisphericLight("light1", new Vector3(.5, 1, 1).normalize(), this.scene);
        light.groundColor = new Color3(0, 0, 0);
        light.diffuse = new Color3(1, 1, 1);
        light.intensity = .8;
        const physics = new CustomPhysics(this.scene, config);
        physics
            .initializeAsync()
            .then(() => {
                const ground = this.createGround();
                new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, this.scene);
                //createPoints(20, 20);
                this.createBackgroundAudio();
                this._groundMeshObservable.notifyObservers(ground);
                this.createWalls();
            });
    }
    public get groundMeshObservable() {
        return this._groundMeshObservable;
    }

    private createBackgroundAudio() {
        const noise = new Sound("backgroundNoise", "/assets/sounds/noise.mp3", this.scene, null, {
            loop: true,
            volume: .2,
            autoplay: true
        });
    }
    private createGround() {
        const scene = this.scene;

        const ground: GroundMesh = MeshBuilder.CreateGround("ground", {
            width: 20,
            height: 20,
            subdivisions: 1
        }, scene);
        ground.material = createGridMaterial(Color3.FromHexString("#aaffaa"), Color3.FromHexString("#111511"));

        //buildAvatar(scene);
        return ground;
    }

    private createWalls() {
        const color1 = Color3.FromHexString("#ff9999");
        const color2 = Color3.FromHexString("#221111");
        const color3 = Color3.FromHexString("#9999ff");
        const color4 = Color3.FromHexString("#111115");

        this.createWall(new Vector3(0, 10, 10), new Vector3(0, 0, 0), color3, color4);
        this.createWall(new Vector3(0, 10, -10), new Vector3(0, Math.PI, 0), color3, color4);
        this.createWall(new Vector3(10, 10, 0), new Vector3(0, Math.PI / 2, 0), color1, color2);
        this.createWall(new Vector3(-10, 10, 0), new Vector3(0, -Math.PI / 2, 0), color1, color2);
    }
    private createWall(position: Vector3, rotation: Vector3, color1: Color3, color2: Color3) {
        const scene = this.scene;
        const wall = MeshBuilder.CreatePlane("wall", {width: 20, height: 20}, scene);
        wall.isPickable = false;
        wall.isNearPickable = false;
        wall.position = position;
        wall.rotation = rotation;
        wall.material = createGridMaterial(color1, color2);
        return wall;
    }
}


async function createPoints(divisions: number = 10, scale: number = 80) {
    const scene = DefaultScene.Scene;
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

function createGridMaterial(lineColor: Color3, mainColor: Color3): Material {
    const scene = DefaultScene.Scene;
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
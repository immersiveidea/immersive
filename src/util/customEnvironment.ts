import {
    GroundMesh,
    MeshBuilder,
    Observable,
    PBRMetallicRoughnessMaterial,
    PhotoDome,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Texture
} from "@babylonjs/core";
import {CustomPhysics} from "./customPhysics";
import {DiaSounds} from "./diaSounds";

export class CustomEnvironment {
    private readonly scene: Scene;
    private readonly name: string;
    private readonly _groundMeshObservable: Observable<GroundMesh> = new Observable<GroundMesh>();

    constructor(scene: Scene, name: string = "default") {
        this.scene = scene;
        this.name = name;
        new DiaSounds(scene);
        const physics = new CustomPhysics(this.scene);
        physics
            .initializeAsync()
            .then(() => {
                const ground = this.createGround();
                this._groundMeshObservable.notifyObservers(ground);
            });
        const photo = new PhotoDome('sky',
            './outdoor_field2.jpeg', {},
            scene);

    }

    public get groundMeshObservable() {
        return this._groundMeshObservable;
    }

    private createGround() {
        const scene = this.scene;
        const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
        const gText = new Texture("./grass1.jpeg", scene);
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
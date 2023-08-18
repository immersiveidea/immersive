import {
    AbstractMesh,
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


export class Introduction {
    private scene: Scene;
    private manager: GUI3DManager;
    private physicsHelper: PhysicsHelper;
    private current: AbstractMesh[] = [];
    private step: number = 0;
    private items: AbstractMesh[] = [];
    private advance: Button3D;
    constructor(scene: Scene) {
        this.scene = scene;
        this.manager = new GUI3DManager(scene);
        this.physicsHelper = new PhysicsHelper(scene);
    }

    public start() {
        this.scene.physicsEnabled = true;
        this.advance = new Button3D("advance");
        const text = new TextBlock("advance", "Click Me");
        text.fontSize = "48px";
        text.color = "#ffffff";
        text.alpha = 1;
        this.advance.content = text;

        this.advance.onPointerClickObservable.add(() => {
            console.log("click");
            this.takeStep();
        }, -1, false, this, false);
        this.manager.addControl(this.advance);
        this.advance.isVisible = false;
        this.advance.position.y = 0;
        this.advance.position.x = 2;
        this.scene.onReadyObservable.add(() => {
            this.advance.isVisible = true;
        });
    }

    buildVideo(url: string, size: number, position: Vector3): AbstractMesh {
        const texture = new VideoTexture("video", url, this.scene, true);
        const mesh = this.makeObject("video", position, size);
        mesh.material = new StandardMaterial("video_material", this.scene);
        (mesh.material as StandardMaterial).diffuseTexture = texture;
        texture.update();
        return mesh;
    }

    makeObject(text: string, position: Vector3, size: number): AbstractMesh {
        const welcome = MeshBuilder.CreateTiledBox(text + "_box", {width: 1, height: 1, depth: 1}, this.scene);
        welcome.position = position;
        welcome.scaling = new Vector3(size, size / 2, size);

        const aggregate = new PhysicsAggregate(welcome, PhysicsShapeType.BOX, {
            friction: 1,
            mass: 1,
            restitution: .1
        }, this.scene);
        aggregate.body.getCollisionObservable().add((collider) => {
            if (collider.impulse > .4) {
                DiaSounds.instance.low.play();
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
        mesh.material.alpha = .9;
        (mesh.material as StandardMaterial).diffuseTexture = texture;
        texture.update();
        return mesh;
    }

    private takeStep() {
        this.current.forEach((mesh) => {
            const pos = mesh.physicsBody.transformNode.absolutePosition.clone();
            pos.x = pos.x - .1;
            mesh.physicsBody.applyImpulse(new Vector3(0, 8, 12), pos);
        });

        switch (this.step) {
            case 0:
                this.items.push(this.buildText("Welcome To", 3, 1024, new Vector3(0, 15, 5)));
                this.items.push(this.buildText("Deep Diagram", 5, 1024, new Vector3(0, 10, 5)));
                this.current = this.items.slice(-2);
                break;
            case 1:
                this.items.push(this.buildText("Let us show you", 3, 1024, new Vector3(-1.5, 16, 5)));
                this.items.push(this.buildText("what you can build", 4, 1200, new Vector3(2, 12, 5)));
                this.current = this.items.slice(-2);
                break;
            case 2:
                this.items.push(this.buildText("A quick video", 5, 1024, new Vector3(0, 15, 5)));
                this.current = this.items.slice(-1);
                break;
            case 3:
                this.items.push(this.buildVideo("A quick video", 5, new Vector3(0, 8, 5)));
                this.current = this.items.slice(-1);
                break;
            case 4:
                this.items.forEach((mesh) => {
                    mesh.physicsBody.dispose();
                    mesh.dispose();
                });
                this.advance.dispose();
                this.manager.dispose();
                AppConfig.config.demoCompleted = true;
                this.items = [];
        }
        this.step++;

    }

}
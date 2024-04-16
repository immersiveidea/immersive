import {
    AbstractMesh,
    Animation,
    DynamicTexture,
    GPUParticleSystem,
    MeshBuilder,
    ParticleSystem,
    Scene,
    SphereParticleEmitter,
    StandardMaterial,
    Texture
} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

export class Spinner {
    private readonly _scene: Scene;
    private spinner: AbstractMesh;
    private particleSystem: ParticleSystem;

    constructor() {
        this._scene = DefaultScene.scene;
        this.build();
    }

    public show() {
        this.spinner.setEnabled(true);
        this.particleSystem.start();
    }

    public hide() {
        this.spinner.setEnabled(false);
        this.particleSystem.stop(true);
    }

    private build() {
        const spinner: AbstractMesh = MeshBuilder.CreateSphere("spinner", {diameter: 2}, this._scene);
        const material = new StandardMaterial("spinner", this._scene);
        const text = new DynamicTexture("spinner", {width: 1024, height: 1024}, this._scene, false);
        text.drawText("Please Wait", 250, 500, "bold 150px Segoe UI", "white", "transparent", true, true);
        spinner.rotation.z = Math.PI;
        material.diffuseTexture = text;
        material.diffuseColor.set(.5, .5, 0);
        const rotate = new Animation("rotate", "rotation.y", 10,
            Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const keys = [];
        keys.push({
            frame: 0,
            value: 0
        });
        keys.push({
            frame: 30,
            value: Math.PI * 2
        });
        rotate.setKeys(keys);
        spinner.animations.push(rotate);
        this._scene.beginAnimation(spinner, 0, 30, true);

        material.alpha = .9;
        spinner.material = material;
        let particleSystem;
        if (GPUParticleSystem.IsSupported) {
            particleSystem = new GPUParticleSystem("particles", {capacity: 100000}, this._scene);
            particleSystem.activeParticleCount = 2048;
        } else {
            particleSystem = new ParticleSystem("particles", 2048, this._scene);
        }
        particleSystem.emitRate = 10;
        const emitter = new SphereParticleEmitter(.9);
        emitter.radiusRange = .2;
        particleSystem.particleEmitterType = emitter;

        particleSystem.particleTexture = new Texture("/assets/textures/flare.png", this._scene);


        particleSystem.minEmitPower = .1;
        particleSystem.maxEmitPower = .25;

        particleSystem.minLifeTime = .1;
        particleSystem.maxLifeTime = .8;
        particleSystem.minSize = 0.01;
        particleSystem.maxSize = 0.05;
        particleSystem.emitter = spinner;
        particleSystem.parent = spinner;
        spinner.position.y = 1;
        spinner.position.z = 6;

        this.spinner = spinner;
        this.spinner.setEnabled(false);
        this.particleSystem = particleSystem;
    }
}
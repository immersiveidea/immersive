import {
    AbstractMesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {ControllerEventType, Controllers} from "../controllers/controllers";

export class Ball {
    private readonly scene: Scene;
    private transformNode: TransformNode;
    private mesh: AbstractMesh;
    private position: Vector3 = new Vector3(0, .5, 0);
    private parent: AbstractMesh;
    private controllers: Controllers;
    private physicsAggregate: PhysicsAggregate;

    constructor(scene: Scene) {
        this.scene = scene;
        this.buildBall();
    }

    public setControllers(controllers: Controllers) {
        this.controllers = controllers;
        this.controllers.controllerObserver.add((event) => {
            if (event.type == ControllerEventType.MOTION) {

            }
        });
    }

    public kick(direction: Vector3, force: number) {
        this.physicsAggregate.body.applyImpulse(direction.scale(force), Vector3.Zero());
    }

    private buildBall() {
        SceneLoader.ImportMesh(null, "/assets/models/", "ball.gltf", this.scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
                console.log('ball loaded');
                this.mesh = meshes[0];
                this.parent = MeshBuilder.CreateSphere("ballParent", {diameter: .17}, this.scene);

                this.parent.isVisible = false;
                this.parent.position = this.position;

                this.scene.onBeforeRenderObservable.add(() => {
                    if (!this.physicsAggregate &&
                        this.scene?.getPhysicsEngine()?.getPhysicsPlugin()) {
                        console.log("creating physics aggregate");
                        this.physicsAggregate = new PhysicsAggregate(this.parent,
                            PhysicsShapeType.SPHERE, {mass: 1, restitution: .6, friction: .6}, this.scene);
                        this.physicsAggregate.body.setLinearDamping(.3);
                        this.physicsAggregate.body.setAngularDamping(2);
                        this.mesh.setParent(this.physicsAggregate.transformNode);
                        this.mesh.position.y = 0;
                        return;
                    }
                }, -1, false, this, false);

                //animationGroups[0].stop();

                //this.animationGroup = animationGroups[6];
                //this.animationGroup.start(false, 1, 266, 266);


            });
    }
}
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
import log, {Logger} from "loglevel";

export class Ball {
    private readonly logger: Logger = log.getLogger('Ball');
    private readonly scene: Scene;
    private transformNode: TransformNode;
    private mesh: AbstractMesh;
    _position: Vector3 = new Vector3(0, .5, 0);
    private parent: AbstractMesh;
    private controllers: Controllers;
    private physicsAggregate: PhysicsAggregate;

    constructor(scene: Scene) {
        this.scene = scene;
        this.buildBall();
    }

    public setControllers(controllers: Controllers) {
        this.controllers = controllers;
        this.controllers.controllerObservable.add((event) => {
            if (event.type == ControllerEventType.MOTION) {

            }
        });
    }

    public kick(direction: Vector3, force: number) {
        this.physicsAggregate.body.applyImpulse(direction.scale(force), Vector3.Zero());
    }

    public get position(): Vector3 {
        return this.physicsAggregate.transformNode.absolutePosition;
    }

    private buildBall() {
        SceneLoader.ImportMesh(null, "/assets/models/", "ball.gltf", this.scene,
            (meshes) => {
                this.logger.debug('ball loaded');
                this.mesh = meshes[0];
                this.parent = MeshBuilder.CreateSphere("ballParent", {diameter: .17}, this.scene);

                this.parent.isVisible = false;
                this.parent.position = this._position;

                this.scene.onBeforeRenderObservable.add(() => {
                    if (!this.physicsAggregate &&
                        this.scene?.getPhysicsEngine()?.getPhysicsPlugin()) {
                        this.logger.debug("creating physics aggregate");
                        this.physicsAggregate = new PhysicsAggregate(this.parent,
                            PhysicsShapeType.SPHERE, {mass: 1, restitution: .6, friction: .6}, this.scene);
                        this.physicsAggregate.body.setLinearDamping(.3);
                        this.physicsAggregate.body.setAngularDamping(2);
                        this.mesh.setParent(this.physicsAggregate.transformNode);
                        this.mesh.position.y = 0;
                        return;
                    }
                }, -1, false, this, false);

            });
    }
}
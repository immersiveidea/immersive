import {
    AbstractMesh,
    AnimationGroup,
    MeshBuilder,
    Observable,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    TransformNode,
    Vector2,
    Vector3
} from "@babylonjs/core";

export class Player {
    public readonly onReadyObservable: Observable<any> = new Observable();
    private readonly scene: Scene;
    private readonly position: Vector3;
    private mesh: TransformNode;
    private parent: AbstractMesh;
    private animationGroup: AnimationGroup;
    private physicsAggregate: PhysicsAggregate;

    constructor(scene: Scene, position: Vector3) {
        this.scene = scene;
        this.position = position;
        this.buildPlayer();
    }

    buildPlayer() {
        SceneLoader.ImportMesh(null, "/assets/models/", "player2.glb", this.scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
                this.mesh = meshes[0];
                this.parent = MeshBuilder.CreateCylinder("playerParent", {diameter: .5, height: 1.6}, this.scene);
                this.parent.position = this.position;
                this.parent.isVisible = false;
                this.physicsAggregate = new PhysicsAggregate(this.parent,
                    PhysicsShapeType.CYLINDER, {mass: 50, restitution: .02, friction: 0}, this.scene);
                animationGroups[0].stop();

                this.animationGroup = animationGroups[6];
                this.animationGroup.start(false, 1, 266, 266);
                this.mesh.setParent(this.physicsAggregate.transformNode);
                this.mesh.position.x = 3;
                this.mesh.position.y = -.84;
                this.onReadyObservable.notifyObservers(this);
            });
    }

    public runTo(location: Vector2) {
        this.animationGroup.stop();
        this.animationGroup.start(true, 1.5, 0, 250);
        this.physicsAggregate.body.transformNode.lookAt(new Vector3(location.x, 2, location.y));
        const speed = location.normalize().scale(2);
        this.physicsAggregate.body.setLinearVelocity(new Vector3(0, 0, 3));
        //this.physicsAggregate.body.setAngularVelocity(new Vector3(0, .1, 0));


    }
}
import {
    AbstractMesh,
    AnimationGroup,
    AssetContainer,
    Mesh,
    MeshBuilder,
    Observable,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    Skeleton,
    Texture,
    Vector2,
    Vector3
} from "@babylonjs/core";
import log, {Logger} from "loglevel";

export class PlayerFactory {
    private readonly logger: Logger = log.getLogger('PlayerFactory')
    public onReadyObservable: Observable<any> = new Observable();
    private readonly scene: Scene;
    private container: AssetContainer;

    constructor(scene: Scene) {
        this.scene = scene;
        SceneLoader.LoadAssetContainer("/assets/models/",
            "player2.glb",
            this.scene,
            (container: AssetContainer) => {
                this.container = container;
                this.onReadyObservable.notifyObservers(this);
                this.logger.debug('Player Model Loaded');
            });

    }

    public buildPlayer(position: Vector3, number: number, uniformTexture: Texture = null, teamName: string = "team"): Player {
        this.logger.debug(`Building player #${number}, for team ${teamName}`);
        return new Player(this.scene, position, this.container, number, uniformTexture, teamName);
    }

}

export class Player {
    private readonly logger: Logger = log.getLogger('Player');
    public readonly onReadyObservable: Observable<any> = new Observable();
    private readonly scene: Scene;
    private readonly position: Vector3;
    private mesh: Mesh;
    private parent: AbstractMesh;
    private animationGroup: AnimationGroup;
    private physicsAggregate: PhysicsAggregate;
    private skeleton: Skeleton;
    private readonly number: number;
    private readonly teamName: string;
    private forward = true;
    private destination: Vector2;

    constructor(scene: Scene, position: Vector3, container: AssetContainer, number: number = 0, texture: Texture = null, teamName: string = "team") {
        this.scene = scene;
        this.position = position;
        this.number = number;
        this.teamName = teamName;
        const data = container.instantiateModelsToScene(undefined, false, {doNotInstantiate: true});
        this.mesh = (data.rootNodes[0] as Mesh);
        if (texture) {
            ((this.mesh.getChildren()[0].getChildren()[2] as Mesh).material as PBRMaterial).albedoTexture = texture;
//            (this.mesh.material as PBRMaterial).albedoTexture = texture;
        }

        this.skeleton = data.skeletons[0];
        this.animationGroup = data.animationGroups[6];
        this.buildPlayer();
    }

    public lookAt(location: Vector2) {
        const body = this.physicsAggregate.body;

        body.disablePreStep = false;

        body.transformNode.lookAt(new Vector3(location.x, body.transformNode.position.y, location.y));
        this.scene.onAfterRenderObservable.addOnce(() => {

            this.physicsAggregate.body.disablePreStep = true;
            this.animationGroup.stop();
            this.animationGroup.onAnimationGroupEndObservable.add(() => {
                if (this.forward) {
                    this.animationGroup.start(false, .1, 256, 267);
                } else {
                    this.animationGroup.start(false, .1, 267, 256);
                }
                this.forward = !this.forward;
            }, -1, false, this);
            this.animationGroup.start(false, .1, 256, 267);

        });
    }

    public runTo(location: Vector2) {
        this.logger.debug(`Running to ${JSON.stringify(location)}`)
        this.destination = location;
        const body = this.physicsAggregate.transformNode.physicsBody;
        body.setMotionType(PhysicsMotionType.ANIMATED);
        body.disablePreStep = false;
        body.transformNode.lookAt(new Vector3(location.x, body.transformNode.position.y, location.y));
        const vel = new Vector3(location.x, body.transformNode.position.y, location.y);
        this.scene.onBeforeRenderObservable.addOnce(() => {
            body.setLinearVelocity(vel.subtract(body.transformNode.position).normalize().scale(2));
        });
        this.scene.onAfterRenderObservable.addOnce(() => {
            this.physicsAggregate.body.disablePreStep = true;
            this.animationGroup.stop();
            this.animationGroup.start(true, 1.0, 0, 250);
        });
        this.scene.onAfterPhysicsObservable.add(() => {
            if (body.getLinearVelocity().length() > .1) {

                if (this.destination.subtract(new Vector2(body.transformNode.position.x,
                    body.transformNode.position.z)).length() < .1) {
                    body.setLinearVelocity(Vector3.Zero());
                    body.setMotionType(PhysicsMotionType.DYNAMIC);
                    this.animationGroup.stop();
                    this.animationGroup.start(false, .1, 256, 267);
                }
            }
        });

    }

    private buildPlayer() {
        this.parent = MeshBuilder.CreateCylinder(`team${this.teamName}player${this.number}`, {
            diameter: .5,
            height: 1.6
        }, this.scene);
        this.parent.position = this.position;
        this.parent.isVisible = false;
        this.physicsAggregate = new PhysicsAggregate(this.parent,
            PhysicsShapeType.CYLINDER, {mass: 100, restitution: .02, friction: .3}, this.scene);
        this.physicsAggregate.body.setAngularDamping(.5);

        this.mesh.parent = this.physicsAggregate.transformNode;
        this.mesh.metadata = {type: "player", grabbable: true};
        this.mesh.position.x = 3;
        this.mesh.position.y = -.84;
    }
}
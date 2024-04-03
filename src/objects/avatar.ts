import {
    AssetContainer,
    Mesh,
    MeshBuilder,
    Observable,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    Vector3
} from "@babylonjs/core";

export function buildAvatar(scene: Scene) {
    const objectObservable = new Observable<AssetContainer>();
    objectObservable.add((container) => {
        try {

            const data = container.instantiateModelsToScene(undefined, false, {doNotInstantiate: true});
            const mesh = (data.rootNodes[0] as Mesh);
            const body = scene.getMeshByName("Clone of avaturn_body");
            /*body.simplify(
                [
                    {quality: .7, distance: 5},
                    {quality: .1, distance: 10},
                ],
                true,
                SimplificationType.QUADRATIC,
                function() {
                    const skel = scene.getSkeletonById("Clone of Armature");
                    body.parent.getChildMeshes().forEach((m) => {
                        if (m.name.indexOf("ecimated") > -1) {
                            m.skeleton = skel;
                        }
                    });

                }
            )
            */


            const bounds = mesh.getHierarchyBoundingVectors(true);

            const size = bounds.max.subtract(bounds.min);
            const top = MeshBuilder.CreateBox("container", {width: size.x, height: size.y, depth: size.z}, scene);
            top.position.y = 1.6;
            top.metadata = {grabbable: true};
            mesh.parent = top;
            mesh.position.y = -size.y / 2;
            top.position = new Vector3(-.6, size.y / 2 + 1, 0);

            //top.scaling = new Vector3(.1, .1, .1);
            top.visibility = 0;

            //top.physicsBody = new PhysicsBody(top, PhysicsMotionType.DYNAMIC, false, this.scene);

            data.animationGroups[0].play(true);


            const physicsAggregate = new PhysicsAggregate(top,
                PhysicsShapeType.BOX, {mass: 100, restitution: .02, friction: .3}, scene);
            physicsAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
            physicsAggregate.body.setGravityFactor(1);

        } catch (err) {

        }
        //physicsAggregate.body.setAngularDamping(.5);

        //top.physicsBody.setLinearVelocity(Vector3.Up().scale(100));
        //mesh.parent = top.physicsBody.transformNode;


    });
    loadObject(scene, objectObservable);
}

function loadObject(scene: Scene, observable: Observable<AssetContainer>) {
    SceneLoader.LoadAssetContainer("/assets/models/",
        "model.glb",
        scene,
        (container: AssetContainer) => {
            observable.notifyObservers(container);
        });


}
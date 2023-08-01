import {DiagramEntity} from "./diagramEntity";
import {
    AbstractMesh,
    Color3,
    DynamicTexture,
    InstancedMesh,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsBody,
    PhysicsMotionType,
    PhysicsShapeType,
    Quaternion,
    Scene,
    StandardMaterial
} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import log from "loglevel";


export class MeshConverter {
    private static logger = log.getLogger('MeshConverter');

    public static toDiagramEntity(mesh: AbstractMesh): DiagramEntity {
        if (!mesh) {
            this.logger.error("toDiagramEntity: mesh is null");
            return null;
        }
        const entity = <DiagramEntity>{};
        if ("new" == mesh?.id) {
            mesh.id = "id" + uuidv4();
        }
        entity.id = mesh.id;
        entity.position = mesh.position;
        entity.rotation = mesh.rotation;
        entity.last_seen = new Date();
        entity.template = mesh?.metadata?.template;
        entity.text = mesh?.metadata?.text;
        entity.scale = mesh.scaling;
        if (mesh.material) {
            entity.color = (mesh.material as any).diffuseColor.toHexString();
        } else {
            this.logger.error("toDiagramEntity: mesh.material is null");
        }
        return entity;
    }

    public static fromDiagramEntity(entity: DiagramEntity, scene: Scene): AbstractMesh {
        if (!entity) {
            this.logger.error("fromDiagramEntity: entity is null");
            return null;
        }
        if (!entity.id) {
            entity.id = "id" + uuidv4();
        }
        let mesh = scene.getMeshById(entity.id);
        if (mesh) {
            log.debug('mesh already exists');
        } else {
            mesh = scene.getMeshById("tool-" + entity.template + "-" + entity.color);
            if (mesh) {
                if (mesh.isAnInstance) {
                    log.debug('error: mesh is an instance');
                } else {
                    mesh = new InstancedMesh(entity.id, (mesh as Mesh));

                }
            } else {
                log.debug('no mesh found for ' + entity.template + "-" + entity.color);
            }
        }


        if (mesh) {
            mesh.metadata = {template: entity.template};

            if (entity.position) {

                mesh.position = entity.position;


            }
            if (entity.rotation) {
                if (mesh.rotationQuaternion) {
                    mesh.rotationQuaternion = Quaternion.FromEulerAngles(entity.rotation.x, entity.rotation.y, entity.rotation.z);
                } else {
                    mesh.rotation = entity.rotation;
                }

            }
            if (entity.parent) {
                mesh.parent = scene.getNodeById(entity.parent);
            }
            if (entity.scale) {
                mesh.scaling = entity.scale;
            }
            if (!mesh.material) {
                const material = new StandardMaterial("material-" + entity.id, scene);
                material.diffuseColor = Color3.FromHexString(entity.color);
                mesh.material = material;
            }
            if (entity.text) {
                mesh.metadata.text = entity.text;
                this.updateTextNode(mesh, entity.text);
            }
            /*
            const sphereAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, {

                mass: 10,
                restitution: 0.1,
                startAsleep: false
            }, scene);

             */
        } else {
            this.logger.error("fromDiagramEntity: mesh is null after it should have been created");
        }

        return mesh;

    }

    public static applyPhysics(mesh: AbstractMesh, scene: Scene): PhysicsBody {
        if (!mesh?.metadata?.template || !scene) {
            this.logger.error("applyPhysics: mesh or scene is null");
            return null;
        }
        if (mesh.physicsBody) {
            mesh.physicsBody.dispose();
        }
        let shapeType = PhysicsShapeType.BOX;
        switch (mesh.metadata.template) {
            case "#sphere-template":
                shapeType = PhysicsShapeType.SPHERE;
                break;
            case "#cylinder-template":
                shapeType = PhysicsShapeType.CYLINDER;
                break;
            case "#cone-template":
                shapeType = PhysicsShapeType.CONVEX_HULL;
                break;

        }
        const aggregate = new PhysicsAggregate(mesh,
            shapeType, {mass: 20, restitution: .2, friction: .9}, scene);
        const body = aggregate.body;
        body.setMotionType(PhysicsMotionType.ANIMATED);
        body.setLinearDamping(.9);
        body.setAngularDamping(.5);
        body.setGravityFactor(0);
        return aggregate.body;

    }

    public static updateTextNode(mesh: AbstractMesh, text: string) {
        if (!mesh) {
            this.logger.error("updateTextNode: mesh is null");
            return null;
        }
        let textNode = (mesh.getChildren((node) => {
            return node.name == 'text'
        })[0] as Mesh);
        if (textNode) {
            textNode.dispose(false, true);
        }
        if (!text) {
            return null;
        }

        //Set font
        const height = 0.125;
        const font_size = 24;
        const font = "bold " + font_size + "px Arial";
        //Set height for dynamic texture
        const DTHeight = 1.5 * font_size; //or set as wished
        //Calc Ratio
        const ratio = height / DTHeight;

        //Use a temporary dynamic texture to calculate the length of the text on the dynamic texture canvas
        const temp = new DynamicTexture("DynamicTexture", 32, mesh.getScene());
        const tmpctx = temp.getContext();
        tmpctx.font = font;
        const DTWidth = tmpctx.measureText(text).width + 8;

        //Calculate width the plane has to be
        const planeWidth = DTWidth * ratio;

        //Create dynamic texture and write the text
        const dynamicTexture = new DynamicTexture("DynamicTexture", {
            width: DTWidth,
            height: DTHeight
        }, mesh.getScene(), false);
        const mat = new StandardMaterial("mat", mesh.getScene());
        mat.diffuseTexture = dynamicTexture;
        dynamicTexture.drawText(text, null, null, font, "#000000", "#ffffff", true);

        //Create plane and set dynamic texture as material
        const plane = MeshBuilder.CreatePlane("text", {width: planeWidth, height: height}, mesh.getScene());
        plane.material = mat;
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;


        const yOffset = mesh.getBoundingInfo().boundingSphere.radius;
        plane.parent = mesh;
        plane.position.y = yOffset;
        plane.scaling.y = 1 / mesh.scaling.y;
        plane.scaling.x = 1 / mesh.scaling.x;
        plane.scaling.z = 1 / mesh.scaling.z;
        return plane;
    }
}
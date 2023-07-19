import {DiagramEntity} from "./diagramEntity";
import {
    AbstractMesh,
    Color3,
    DynamicTexture,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial
} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';

export class MeshConverter {
    public static toDiagramEntity(mesh: AbstractMesh): DiagramEntity {
        const entity = <DiagramEntity>{};
        entity.id = mesh.id;
        entity.position = mesh.position;
        entity.rotation = mesh.rotation;
        entity.last_seen = new Date();
        entity.template = mesh?.metadata?.template;
        entity.text = mesh?.metadata?.text;
        entity.scale = mesh.scaling;
        if (mesh.material) {
            entity.color = (mesh.material as any).diffuseColor.toHexString();
        }
        return entity;
    }
    public static fromDiagramEntity(entity: DiagramEntity, scene: Scene): AbstractMesh {

            if (!entity.id) {
                entity.id = "id" + uuidv4();
            }
            let mesh: Mesh;
            switch (entity.template) {
                case "#plane-template":

                case "#text-template":

                    const material = new StandardMaterial("material-" + entity.id, scene);
                    material.backFaceCulling = false;
                    const font_size = 48;
                    const font = "bold 48px roboto";
                    const planeHeight=1;
                    const DTHeight = 1.5*font_size;
                    const ratio = planeHeight / DTHeight;
                    const text = 'This is some text to put on a plane';
                    const tempText = new DynamicTexture("dynamic texture", 64, scene);
                    const tempContext = tempText.getContext();
                    tempContext.font = font;
                    const DTWidth = tempContext.measureText(text).width;
                    const planeWidth = DTWidth * ratio;


                    const myDynamicTexture = new DynamicTexture("dynamic texture",
                        {width: DTWidth, height: DTHeight},
                        scene, false);
                    mesh= MeshBuilder.CreatePlane(entity.id, {
                        width: planeWidth,
                        height: planeHeight
                    }, scene);

                    myDynamicTexture.drawText('This is some short text',
                        null, null,

                        font, "#000000", "#FFFFFF",
                        true, true);
                    material.diffuseTexture = myDynamicTexture;
                    mesh.material = material;

                    break;
                case "#box-template":
                    mesh = MeshBuilder.CreateBox(entity.id,
                        {
                            width: 1,
                            height: 1,
                            depth: 1
                        }, scene);

                    break;
                case "#sphere-template":
                    mesh = MeshBuilder.CreateSphere(entity.id, {diameter: 1}, scene);
                    break
                case "#cylinder-template":
                    mesh = MeshBuilder.CreateCylinder(entity.id, {
                        diameter: 1,
                        height: 1
                    }, scene);
                    break;
                default:
                    mesh = null;
            }
            if (mesh) {
                mesh.metadata = {template: entity.template};
                if (entity.text) {
                    mesh.metadata.text = entity.text;
                }
                if (entity.position) {
                    mesh.position = entity.position;
                }
                if (entity.rotation) {
                    mesh.rotation = entity.rotation;
                }
                if (entity.parent) {
                    mesh.parent = scene.getMeshByName(entity.parent);
                }
                if (entity.scale) {
                    mesh.scaling = entity.scale;
                }
                if (!mesh.material) {
                    const material = new StandardMaterial("material-" + entity.id, scene);
                    material.diffuseColor = Color3.FromHexString(entity.color);
                    mesh.material = material;
                }
            }

            return mesh;

    }

}
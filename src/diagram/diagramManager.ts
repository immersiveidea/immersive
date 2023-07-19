import {
    AbstractMesh,
    Color3, DynamicTexture,
    Mesh,
    MeshBuilder,
    Observable,
    Scene,
    StandardMaterial,
    WebXRExperienceHelper
} from "@babylonjs/core";
import {v4 as uuidv4} from 'uuid';
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {PersistenceManager} from "./persistenceManager";

export class DiagramManager {
    private persistenceManager: PersistenceManager = new PersistenceManager();
    static onDiagramEventObservable = new Observable();
    private readonly scene: Scene;
    private xr: WebXRExperienceHelper;
    static currentMesh: AbstractMesh;

    constructor(scene: Scene, xr: WebXRExperienceHelper) {
        this.scene = scene;
        this.xr = xr;
        this.persistenceManager.updateObserver.add(this.#onRemoteEvent, -1, true, this);
        this.persistenceManager.initialize();
        if (!DiagramManager.onDiagramEventObservable) {
            DiagramManager.onDiagramEventObservable = new Observable();
        }
        if (DiagramManager.onDiagramEventObservable.hasObservers()) {

        } else {
            DiagramManager.onDiagramEventObservable.add(this.#onDiagramEvent, -1, true, this);
        }
    }


    #onRemoteEvent(event: DiagramEntity) {
        const mesh = this.#createMesh(event);
        if (!mesh.material) {
            const material = new StandardMaterial("material-" + event.id, this.scene);
            material.diffuseColor = Color3.FromHexString(event.color);
            mesh.material = material;
        }

    }

    #onDiagramEvent(event: DiagramEvent) {
        const entity = event.entity;
        let mesh;
        let material
        if (entity) {
            mesh = this.scene.getMeshByName(entity.id);
            if (mesh) {
                material = mesh.material;
            }
        }

        switch (event.type) {
            case DiagramEventType.CLEAR:
                if (DiagramManager.currentMesh) {
                    DiagramManager.currentMesh.dispose();
                    DiagramManager.currentMesh = null;
                }
                break;
            case DiagramEventType.DROPPED:
                break;
            case DiagramEventType.DROP:
                if (DiagramManager.currentMesh) {
                    this.persistenceManager.add(DiagramManager.currentMesh);
                    const newName = uuidv4();
                    const newMesh = DiagramManager.currentMesh.clone("id" + newName, DiagramManager.currentMesh.parent);

                    newMesh.material = DiagramManager.currentMesh.material.clone("material" + newName);
                    DiagramManager.currentMesh.setParent(null);
                    //DiagramManager.currentMesh.billboardMode = Mesh.BILLBOARDMODE_Y;
                    DiagramManager.currentMesh = newMesh;
                    DiagramManager.onDiagramEventObservable.notifyObservers({
                        type: DiagramEventType.DROPPED,
                        entity: entity
                    });
                }
                break;
            case DiagramEventType.ADD:
                if (DiagramManager.currentMesh) {
                    DiagramManager.currentMesh.dispose();
                }
                if (mesh) {
                    return;
                } else {
                    mesh = this.#createMesh(entity);
                    if (!material) {

                    }
                    if (!mesh) {
                        return;
                    }
                }
                DiagramManager.currentMesh = mesh;
                break;
            case DiagramEventType.MODIFY:
                if (!mesh) {

                } else {
                    if (!material) {

                    }
                    mesh.material = material;
                    mesh.position = entity.position;
                    mesh.rotation = entity.rotation;
                    if (entity.parent) {
                        mesh.parent = this.scene.getMeshByName(entity.parent);
                    } else {

                    }
                }
                DiagramManager.currentMesh = mesh;
                break;
            case DiagramEventType.REMOVE:
                break;
        }
    }

    #createMesh(entity: DiagramEntity) {
        if (!entity.id) {
            entity.id = "id" + uuidv4();
        }
        let mesh: Mesh;
        switch (entity.template) {
            case "#plane-template":

            case "#text-template":

                const material = new StandardMaterial("material-" + entity.id, this.scene);
                material.backFaceCulling = false;
                const font_size = 48;
                const font = "bold 48px roboto";
                const planeHeight=1;
                const DTHeight = 1.5*font_size;
                const ratio = planeHeight / DTHeight;
                const text = 'This is some text to put on a plane';
                const tempText = new DynamicTexture("dynamic texture", 64, this.scene);
                const tempContext = tempText.getContext();
                tempContext.font = font;
                const DTWidth = tempContext.measureText(text).width;
                const planeWidth = DTWidth * ratio;


                const myDynamicTexture = new DynamicTexture("dynamic texture",
                    {width: DTWidth, height: DTHeight},
                    this.scene, false);
                mesh= MeshBuilder.CreatePlane(entity.id, {
                    width: planeWidth,
                    height: planeHeight
                }, this.scene);

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
                    }, this.scene);

                break;
            case "#sphere-template":
                mesh = MeshBuilder.CreateSphere(entity.id, {diameter: 1}, this.scene);
                break
            case "#cylinder-template":
                mesh = MeshBuilder.CreateCylinder(entity.id, {
                    diameter: 1,
                    height: 1
                }, this.scene);
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
                mesh.parent = this.scene.getMeshByName(entity.parent);
            }
            if (entity.scale) {
                mesh.scaling = entity.scale;
            }
            if (!mesh.material) {
                const material = new StandardMaterial("material-" + entity.id, this.scene);
                material.diffuseColor = Color3.FromHexString(entity.color);
                mesh.material = material;
            }
        }

        return mesh;
    }
}
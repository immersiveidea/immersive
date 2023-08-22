import {
    AbstractMesh,
    ActionManager,
    Color3,
    ExecuteCodeAction,
    InstancedMesh,
    Mesh,
    Observable,
    PhysicsAggregate,
    PhysicsMotionType,
    PhysicsShapeType,
    PlaySoundAction,
    Scene,
    Vector3
} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./diagramEntity";
import {IPersistenceManager} from "../integration/iPersistenceManager";
import {MeshConverter} from "./meshConverter";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {AppConfig} from "../util/appConfig";
import {TextLabel} from "./textLabel";
import {Toolbox} from "../toolbox/toolbox";


export class DiagramManager {
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly logger = log.getLogger('DiagramManager');
    private persistenceManager: IPersistenceManager = null;
    private readonly toolbox: Toolbox;
    private readonly scene: Scene;
    private sounds: DiaSounds;

    constructor(scene: Scene, controllers: Controllers, toolbox: Toolbox) {
        this.sounds = new DiaSounds(scene);
        this.scene = scene;
        this.toolbox = toolbox;
        this.controllers = controllers;
        this.actionManager = new ActionManager(this.scene);
        this.actionManager.registerAction(
            new PlaySoundAction(ActionManager.OnPointerOverTrigger, this.sounds.tick));
        this.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
                this.controllers.controllerObserver.notifyObservers({
                    type: 'pulse',
                    gripId: evt?.additionalData?.pickResult?.gripTransform?.id
                })
                this.logger.debug(evt);
            })
        );
        if (this.onDiagramEventObservable.hasObservers()) {
            this.logger.warn("onDiagramEventObservable already has Observers, you should be careful");
        }
        this.onDiagramEventObservable.add(this.onDiagramEvent, -1, true, this);
        this.logger.debug("DiagramManager constructed");
        scene.onMeshRemovedObservable.add((mesh) => {
            if (mesh?.metadata?.template) {
                if (mesh.metadata.template != '#connection-template') {
                    scene.meshes.forEach((m) => {
                        if (m?.metadata?.to == mesh.id || m?.metadata?.from == mesh.id) {
                            this.logger.debug("removing connection", m.id);
                            this.onDiagramEventObservable.notifyObservers({
                                type: DiagramEventType.REMOVE,
                                entity: MeshConverter.toDiagramEntity(m)
                            });
                        }
                    });
                }
            }
        });
    }

    private _config: AppConfig;

    private getPersistenceManager(): IPersistenceManager {
        if (!this.persistenceManager) {
            this.logger.warn("persistenceManager not set");
            return null;
        }
        return this.persistenceManager;
    }

    private readonly actionManager: ActionManager;
    private controllers: Controllers;

    public get config(): AppConfig {
        return this._config;
    }

    public setPersistenceManager(persistenceManager: IPersistenceManager) {
        this.persistenceManager = persistenceManager;
        this._config = new AppConfig(persistenceManager);
        this.persistenceManager.updateObserver.add(this.onRemoteEvent, -1, true, this);
    }

    public createCopy(mesh: AbstractMesh, copy: boolean = false): AbstractMesh {
        let newMesh;
        if (!mesh.isAnInstance) {
            newMesh = new InstancedMesh("new", (mesh as Mesh));
        } else {
            newMesh = new InstancedMesh("new", (mesh as InstancedMesh).sourceMesh);
        }
        newMesh.actionManager = this.actionManager;
        newMesh.position = mesh.absolutePosition.clone();
        if (mesh.absoluteRotationQuaternion) {
            newMesh.rotation = mesh.absoluteRotationQuaternion.toEulerAngles().clone();
        } else {
            this.logger.error("no rotation quaternion");
        }
        if (copy) {
            newMesh.scaling = mesh.scaling.clone();
        } else {
            if (this.config.current?.createSnap) {
                newMesh.scaling.x = this.config.current?.createSnap;
                newMesh.scaling.y = this.config.current?.createSnap;
                newMesh.scaling.z = this.config.current?.createSnap;
            } else {
                newMesh.scaling = Vector3.One();
            }


        }
        newMesh.material = mesh.material;

        newMesh.metadata = this.deepCopy(mesh.metadata);
        if (this.config.current?.physicsEnabled) {
            DiagramShapePhysics.applyPhysics(this.sounds, newMesh, this.scene);
        }

        this.persistenceManager.add(newMesh);
        return newMesh;
    }

    private deepCopy<T, U = T extends Array<infer V> ? V : never>(source: T): T {
        if (Array.isArray(source)) {
            return source.map(item => (this.deepCopy(item))) as T & U[]
        }
        if (source instanceof Date) {
            return new Date(source.getTime()) as T & Date
        }
        if (source && typeof source === 'object') {
            return (Object.getOwnPropertyNames(source) as (keyof T)[]).reduce<T>((o, prop) => {
                Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop)!)
                o[prop] = this.deepCopy(source[prop])
                return o
            }, Object.create(Object.getPrototypeOf(source)))
        }
        return source
    }

    private onRemoteEvent(event: DiagramEntity) {
        this.logger.debug(event);
        const toolMesh = this.scene.getMeshById("tool-" + event.template + "-" + event.color);
        if (!toolMesh && (event.template != '#connection-template')) {
            log.debug('no mesh found for ' + event.template + "-" + event.color, 'adding it');
            //this.getPersistenceManager()?.changeColor(null, Color3.FromHexString(event.color));
            this.toolbox.updateToolbox(event.color);
        }
        const mesh = MeshConverter.fromDiagramEntity(event, this.scene);
        mesh.actionManager = this.actionManager;
        if (event.parent) {
            mesh.parent = this.scene.getMeshById(event.parent);
        }
        if (this.config.current?.physicsEnabled) {
            DiagramShapePhysics.applyPhysics(this.sounds, mesh, this.scene, PhysicsMotionType.DYNAMIC);
        }
    }

    private onDiagramEvent(event: DiagramEvent) {
        this.logger.debug(event.type);
        const entity = event.entity;
        let mesh;
        if (entity) {
            mesh = this.scene.getMeshById(entity.id);
        }
        if (!mesh && event?.entity?.template) {
            const toolMesh = this.scene.getMeshById("tool-" + event.entity.template + "-" + event.entity.color);
            if (!toolMesh && event.type != DiagramEventType.CHANGECOLOR) {
                log.debug('no mesh found for ' + event.entity.template + "-" + event.entity.color, 'adding it');
                this.toolbox.updateToolbox(event.entity.color);
            }
            mesh = MeshConverter.fromDiagramEntity(event.entity, this.scene);
            if (mesh) {
                mesh.actionManager = this.actionManager;
                if (this.config.current.physicsEnabled) {
                    DiagramShapePhysics.applyPhysics(this.sounds, mesh, this.scene, PhysicsMotionType.DYNAMIC);
                }

            }

        }
        switch (event.type) {
            case DiagramEventType.CLEAR:

                break;
            case DiagramEventType.DROPPED:
                break;
            case DiagramEventType.DROP:
                if (mesh.metadata.template.indexOf('#') > -1) {
                    this.getPersistenceManager()?.modify(mesh);
                    TextLabel.updateTextNode(mesh, entity.text);
                }

                break;
            case DiagramEventType.ADD:
                this.getPersistenceManager()?.add(mesh);
                if (!mesh.actionManager) {
                    mesh.actionManager = this.actionManager;
                }
                if (this.config.current.physicsEnabled) {
                    DiagramShapePhysics
                        .applyPhysics(this.sounds, mesh, this.scene);
                }

                break;
            case DiagramEventType.MODIFY:
                this.getPersistenceManager()?.modify(mesh);
                if (this.config.current.physicsEnabled) {
                    DiagramShapePhysics
                        .applyPhysics(this.sounds, mesh, this.scene);
                }

                break;
            case DiagramEventType.CHANGECOLOR:
                if (!event.oldColor) {
                    if (!event.newColor) {
                        this.getPersistenceManager()?.changeColor(null, Color3.FromHexString(event.entity.color));
                        this.logger.info("Recieved color change event, sending entity color as new color");
                    } else {
                        this.logger.info("Recieved color change event, no old color, sending new color");
                        this.getPersistenceManager()?.changeColor(null, event.newColor);
                    }
                } else {
                    if (event.newColor) {
                        this.logger.info("changing color from " + event.oldColor + " to " + event.newColor);
                        this.getPersistenceManager()?.changeColor(event.oldColor, event.newColor);
                    } else {
                        this.logger.error("changing color from " + event.oldColor + ", but no new color found");
                    }
                }

                break;
            case DiagramEventType.REMOVE:
                if (mesh) {
                    this.getPersistenceManager()?.remove(mesh)
                    mesh?.physicsBody?.dispose();
                    mesh.dispose();
                    this.sounds.exit.play();

                }
                break;
        }
    }

}

class DiagramShapePhysics {
    private static logger: log.Logger = log.getLogger('DiagramShapePhysics');

    public static applyPhysics(sounds: DiaSounds, mesh: AbstractMesh, scene: Scene, motionType?: PhysicsMotionType) {
        if (!mesh?.metadata?.template) {
            this.logger.error("applyPhysics: mesh.metadata.template is null", mesh);
            return;
        }
        if (mesh.metadata.template == '#connection-template') {
            return;
        }
        if (!scene) {
            this.logger.error("applyPhysics: mesh or scene is null");
            return;
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
        let mass = mesh.scaling.x * mesh.scaling.y * mesh.scaling.z * 10;

        const aggregate = new PhysicsAggregate(mesh,
            shapeType, {mass: mass, restitution: .02, friction: .9}, scene);
        const body = aggregate.body;
        body.setLinearDamping(1.95);
        body.setAngularDamping(1.99);

        if (motionType) {
            body
                .setMotionType(motionType);
        } else {
            if (mesh.parent) {
                body
                    .setMotionType(PhysicsMotionType.ANIMATED);
            } else {
                body
                    .setMotionType(PhysicsMotionType.DYNAMIC);
            }
        }
        body.setCollisionCallbackEnabled(true);
        body.getCollisionObservable().add((event) => {

            if (event.impulse < 10 && event.impulse > 1) {
                const sound = sounds.bounce;
                sound.setVolume(event.impulse / 10);
                sound.attachToMesh(mesh);
                sound.play();
            }
        }, -1, false, this);
        //body.setMotionType(PhysicsMotionType.ANIMATED);
        body.setLinearDamping(.95);
        body.setAngularDamping(.99);
        body.setGravityFactor(0);

    }
}
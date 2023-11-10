import {AbstractMesh, ActionManager, Color3, InstancedMesh, Mesh, Observable, Scene} from "@babylonjs/core";
import {DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {DiaSounds} from "../util/diaSounds";
import {AppConfig} from "../util/appConfig";
import {Toolbox} from "../toolbox/toolbox";
import {PresentationManager} from "./presentationManager";
import {diagramEventHandler} from "./functions/diagramEventHandler";
import {deepCopy} from "../util/functions/deepCopy";
import {applyPhysics} from "./functions/diagramShapePhysics";
import {applyScaling} from "./functions/applyScaling";
import {toDiagramEntity} from "./functions/toDiagramEntity";
import {v4 as uuidv4} from 'uuid';
import {buildEntityActionManager} from "./functions/buildEntityActionManager";
import {isDiagramEntity} from "./functions/isDiagramEntity";
import {DiagramListingEvent} from "./types/diagramListing";


export class DiagramManager {
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    public readonly onDiagramEventListingObservable: Observable<DiagramListingEvent> = new Observable();
    private readonly logger = log.getLogger('DiagramManager');
    private readonly toolbox: Toolbox;
    private readonly scene: Scene;
    private readonly sounds: DiaSounds;
    private readonly controllers: Controllers;
    private readonly diagramEntityActionManager: ActionManager;
    private presentationManager: PresentationManager;
    public readonly config: AppConfig;

    constructor(scene: Scene, controllers: Controllers, toolbox: Toolbox, config: AppConfig) {
        this.sounds = new DiaSounds(scene);
        this.scene = scene;
        this.config = config;
        this.toolbox = toolbox;
        this.controllers = controllers;
        this.presentationManager = new PresentationManager(this.scene);
        this.diagramEntityActionManager = buildEntityActionManager(this.scene, this.sounds, this.controllers);

        if (this.onDiagramEventObservable.hasObservers()) {
            this.logger.warn("onDiagramEventObservable already has Observers, you should be careful");
        }
        this.toolbox.colorChangeObservable.add((evt) => {
            this.logger.debug(evt);
            this.onDiagramEventObservable.notifyObservers({
                type: DiagramEventType.CHANGECOLOR,
                oldColor: Color3.FromHexString(evt.oldColor), newColor: Color3.FromHexString(evt.newColor)
            }, 2);
        }, -1, true, this, false);
        this.onDiagramEventObservable.add(this.onDiagramEvent, 1, true, this);
        this.logger.debug("DiagramManager constructed");

        scene.onMeshRemovedObservable.add((mesh) => {
            if (isDiagramEntity(mesh)) {
                if (mesh.metadata.template != '#connection-template') {
                    scene.meshes.forEach((m) => {
                        if (m?.metadata?.to == mesh.id || m?.metadata?.from == mesh.id) {
                            this.logger.debug("removing connection", m.id);
                            this.onDiagramEventObservable.notifyObservers({
                                type: DiagramEventType.REMOVE,
                                entity: toDiagramEntity(m)
                            }, -1);
                        }
                    });
                }
            }
        });
    }

    //@TODO Refactor
    /*public setPersistenceManager(persistenceManager: IPersistenceManager) {
        this.persistenceManager = persistenceManager;
        this._config = new AppConfig(persistenceManager);
        this.persistenceManager.updateObserver.add(this.onRemoteEvent, -1, true, this);
    }*/
    public createCopy(mesh: AbstractMesh, copy: boolean = false): AbstractMesh {
        let newMesh;
        if (!mesh.isAnInstance) {
            newMesh = new InstancedMesh('id' + uuidv4(), (mesh as Mesh));
        } else {
            newMesh = new InstancedMesh('id' + uuidv4(), (mesh as InstancedMesh).sourceMesh);
        }
        newMesh.id = 'id' + uuidv4();

        newMesh.actionManager = this.diagramEntityActionManager;
        newMesh.position = mesh.absolutePosition.clone();

        if (mesh.absoluteRotationQuaternion) {
            newMesh.rotation = mesh.absoluteRotationQuaternion.toEulerAngles().clone();
        } else {
            this.logger.error("no rotation quaternion");
        }
        applyScaling(mesh, newMesh, copy, this.config.current?.createSnap);
        newMesh.material = mesh.material;
        newMesh.metadata = deepCopy(mesh.metadata);
        if (this.config.current?.physicsEnabled) {
            applyPhysics(this.sounds, newMesh, this.scene);
        }
        //@TODO Refactor
        /*this.onDiagramEventObservable.notifyObservers({
            type: DiagramEventType.ADD,
            entity: toDiagramEntity(newMesh)
        }, 2);*/
        //this.persistenceManager.add(toDiagramEntity(newMesh));

        return newMesh;
    }

    private onDiagramEvent(event: DiagramEvent) {
        diagramEventHandler(
            event, this.scene, this.toolbox, this.config.current.physicsEnabled,
            this.diagramEntityActionManager, this.sounds);
    }
}
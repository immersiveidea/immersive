import {AbstractMesh, ActionManager, Observable, Scene} from "@babylonjs/core";
import {DiagramEntity, DiagramEvent, DiagramEventType} from "./types/diagramEntity";
import log from "loglevel";
import {Controllers} from "../controllers/controllers";
import {AppConfig} from "../util/appConfig";
import {buildEntityActionManager} from "./functions/buildEntityActionManager";
import {DefaultScene} from "../defaultScene";
import {DiagramMenuManager} from "./diagramMenuManager";
import {DiagramEventObserverMask} from "./types/diagramEventObserverMask";
import {DiagramObject} from "../objects/diagramObject";
import {DiagramConnection} from "./diagramConnection";


export class DiagramManager {
    private logger = log.getLogger('DiagramManager');
    public readonly _config: AppConfig;
    private readonly _controllers: Controllers;
    private readonly _diagramEntityActionManager: ActionManager;
    public readonly onDiagramEventObservable: Observable<DiagramEvent> = new Observable();
    private readonly _diagramMenuManager: DiagramMenuManager;
    private readonly _scene: Scene;
    private readonly _diagramObjects: Map<string, DiagramObject> = new Map<string, DiagramObject>();
    private readonly _diagramConnections: Map<string, DiagramConnection> = new Map<string, DiagramConnection>();

    constructor() {
        this._scene = DefaultScene.Scene;
        this._config = new AppConfig();
        this._controllers = new Controllers();
        this._diagramMenuManager = new DiagramMenuManager(this.onDiagramEventObservable, this._controllers, this._config);
        this._diagramEntityActionManager = buildEntityActionManager(this._controllers);
        this.onDiagramEventObservable.add(this.onDiagramEvent, DiagramEventObserverMask.FROM_DB, true, this);

        document.addEventListener('uploadImage', (event: CustomEvent) => {
            const diagramEntity: DiagramEntity = {
                template: '#image-template',
                image: event.detail.data,
                text: event.detail.name,
                position: {x: 0, y: 1.6, z: 0},
                rotation: {x: 0, y: Math.PI, z: 0},
                scale: {x: 1, y: 1, z: 1},
            }
            const object = new DiagramObject(this._scene, {diagramEntity: diagramEntity});
            this._diagramObjects.set(diagramEntity.id, object);

            //const newMesh = buildMeshFromDiagramEntity(diagramEntity, this._scene);
            if (this.onDiagramEventObservable) {
                this.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: diagramEntity
                }, DiagramEventObserverMask.TO_DB);
            }

        });
        this.logger.debug("DiagramManager constructed");
    }

    public get diagramMenuManager(): DiagramMenuManager {
        return this._diagramMenuManager;
    }

    public getDiagramObject(id: string) {
        return this._diagramObjects.get(id);
    }

    public isDiagramObject(mesh: AbstractMesh) {
        return this._diagramObjects.has(mesh?.id)
    }

    public get controllers(): Controllers {
        return this._controllers;
    }

    public createCopy(id: string): DiagramObject {
        const diagramObject = this._diagramObjects.get(id);
        if (!diagramObject) {
            return null;
        }
        return diagramObject.clone();
    }

    public get config(): AppConfig {
        return this._config;
    }


    private onDiagramEvent(event: DiagramEvent) {
        switch (event.type) {
            case DiagramEventType.ADD:
                let diagramObject = this._diagramObjects.get(event.entity.id);
                if (diagramObject) {
                    diagramObject.fromDiagramEntity(event.entity);
                } else {
                    diagramObject = new DiagramObject(this._scene,
                        {diagramEntity: event.entity, actionManager: this._diagramEntityActionManager});
                }
                if (diagramObject) {
                    this._diagramObjects.set(event.entity.id, diagramObject);
                }
                break;
            case DiagramEventType.REMOVE:
                const object = this._diagramObjects.get(event.entity.id);
                if (object) {
                    object.dispose();
                }
                this._diagramObjects.delete(event.entity.id);
                break;
            case DiagramEventType.MODIFY:
                console.log(event);
                if (event.entity.text) {
                    const diagramObject = this._diagramObjects.get(event.entity.id);
                    diagramObject.text = event.entity.text;
                }
                break;
        }
    }
}

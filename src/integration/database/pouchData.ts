import {Observable} from "@babylonjs/core";
import {DiagramEntity, DiagramEventType} from "../../diagram/types/diagramEntity";
import {DiagramManager} from "../../diagram/diagramManager";
import {DiagramEventObserverMask} from "../../diagram/types/diagramEventObserverMask";
import log, {Logger} from "loglevel";
import PouchDB from 'pouchdb';

export class PouchData {
    public readonly onDBEntityUpdateObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    public readonly onDBEntityRemoveObservable: Observable<DiagramEntity> = new Observable<DiagramEntity>();
    private _db: PouchDB;
    private _diagramManager: DiagramManager;
    private _logger: Logger = log.getLogger('PouchData');

    constructor(dbname: string) {
        this._db = new PouchDB(dbname);
    }
    public setDiagramManager(diagramManager: DiagramManager) {
        this._diagramManager = diagramManager;
        diagramManager.onDiagramEventObservable.add((evt) => {
            this._logger.debug(evt);
            if (!evt?.entity) {
                this._logger.warn('no entity');
                return;
            }
            if (!evt?.entity?.id) {
                this._logger.warn('no entity id');
                return;
            }
            switch (evt.type) {
                case DiagramEventType.REMOVE:
                    this.remove(evt.entity.id);
                    break;
                case DiagramEventType.ADD:
                case DiagramEventType.MODIFY:
                case DiagramEventType.DROP:
                    this.upsert(evt.entity);
                    break;
                default:
                    this._logger.warn('unknown diagram event type', evt);
            }
        }, DiagramEventObserverMask.TO_DB);

        this.onDBEntityUpdateObservable.add((evt) => {
            this._logger.debug(evt);
            if (evt.id != 'metadata') {
                diagramManager.onDiagramEventObservable.notifyObservers({
                    type: DiagramEventType.ADD,
                    entity: evt
                }, DiagramEventObserverMask.FROM_DB);
            } else {

            }
        });
        this.onDBEntityRemoveObservable.add((entity) => {
            this._logger.debug(entity);
            diagramManager.onDiagramEventObservable.notifyObservers(
                {type: DiagramEventType.REMOVE, entity: entity}, DiagramEventObserverMask.FROM_DB);
        });
    }

    public async remove(id: string) {
        if (!id) {
            return;
        }
        try {
            const doc = await this._db.get(id);
            await this._db.remove(doc);
        } catch (err) {
            this._logger.error(err);
        }
    }

    public async upsert(entity: DiagramEntity) {
        if (!entity) {
            return;
        }
        if (entity.template == '#image-template' && !entity.image) {
            this._logger.error('no image data', entity);
            return;
        }
        let doc = null;
        try {
            doc = await this._db.get(entity.id, {conflicts: true, include_docs: true});
            await this._db.put({_id: doc._id, _rev: doc._rev, ...entity});
        } catch (err) {
            await this._db.put({_id: entity.id, ...entity});
        }
        if (doc && doc._conflicts) {
            this._logger.warn('CONFLICTS!', doc._conflicts);
        }
    }
}
import log from "loglevel";
import {DiagramEntity} from "../../diagram/types/diagramEntity";
import {Observable} from "@babylonjs/core";

export function syncDoc(info: any, onDBRemoveObservable: Observable<DiagramEntity>, onDBUpdateObservable: Observable<DiagramEntity>) {
    const logger = log.getLogger('syncDoc');
    logger.debug(info);
    if (info.direction == 'pull') {
        const docs = info.change.docs;
        for (const doc of docs) {
            logger.debug(doc);
            if (doc._deleted) {
                logger.debug('Delete', doc);
                onDBRemoveObservable.notifyObservers({id: doc._id, template: doc.template}, 1);
            } else {
                onDBUpdateObservable.notifyObservers(doc, 1);
            }

        }

    }
}
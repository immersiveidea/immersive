import log from "loglevel";
import {DiagramEntity} from "../../diagram/types/diagramEntity";
import {Observable} from "@babylonjs/core";
import {UserModelType} from "../../users/userTypes";

export function syncDoc(info: any, onDBRemoveObservable: Observable<DiagramEntity>, onDBUpdateObservable: Observable<DiagramEntity>, onUserObservable: Observable<UserModelType>) {
    const logger = log.getLogger('syncDoc');
    logger.debug(info);
    if (info.direction == 'pull') {
        const docs = info.change.docs;
        for (const doc of docs) {
            if (doc.type == 'user') {
                //onUserObservable.notifyObservers(doc, -1);
            } else {
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
}
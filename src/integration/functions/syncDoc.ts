import log from "loglevel";
import {DiagramEntity} from "../../diagram/types/diagramEntity";
import {Observable} from "@babylonjs/core";
import {Encryption} from "../encryption";
import {DiagramEventObserverMask} from "../../diagram/types/diagramEventObserverMask";

export async function syncDoc(info: any, onDBRemoveObservable: Observable<DiagramEntity>, onDBUpdateObservable: Observable<DiagramEntity>,
                              encryption: Encryption, key: string) {
    const logger = log.getLogger('syncDoc');
    logger.debug(info);
    if (info.direction == 'pull') {
        // @ts-ignore
        const docs = info.change.docs;
        let salt = null;
        for (const doc of docs) {
            if (doc.encrypted) {
                if (salt != doc.encrypted.salt || (key && !encryption.ready)) {
                    await encryption.setPassword(key, doc.encrypted.salt);
                    salt = doc.encrypted.salt
                }
                const decrypted = await encryption.decryptToObject(doc.encrypted.encrypted, doc.encrypted.iv);
                if (decrypted.type == 'user') {
                    //onUserObservable.notifyObservers(doc, -1);
                } else {
                    logger.debug(decrypted);
                    if (doc._deleted) {
                        logger.debug('Delete', doc);
                        onDBRemoveObservable.notifyObservers({
                            id: doc._id,
                            template: decrypted.template
                        }, DiagramEventObserverMask.FROM_DB);
                    } else {
                        onDBUpdateObservable.notifyObservers(decrypted, DiagramEventObserverMask.FROM_DB);
                    }
                }
            } else {
                if (doc.type == 'user') {
                    //onUserObservable.notifyObservers(doc, -1);
                } else {
                    logger.debug(doc);
                    if (doc._deleted) {
                        logger.debug('Delete', doc);
                        onDBRemoveObservable.notifyObservers({
                            id: doc._id,
                            template: doc.template
                        }, DiagramEventObserverMask.FROM_DB);
                    } else {
                        onDBUpdateObservable.notifyObservers(doc, DiagramEventObserverMask.FROM_DB);
                    }
                }
            }
        }
    }
}
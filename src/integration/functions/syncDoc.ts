import log from "loglevel";

const logger = log.getLogger('syncDoc');
export function syncDoc(info) {
    logger.debug(info);
    if (info.direction == 'pull') {
        const docs = info.change.docs;
        for (const doc of docs) {
            logger.debug(doc);
            if (doc._deleted) {
                logger.debug('Delete', doc);
                this.removeObserver.notifyObservers({id: doc._id, template: doc.template}, 1);
            } else {
                this.updateObserver.notifyObservers(doc, 1);
            }

        }
    }

}
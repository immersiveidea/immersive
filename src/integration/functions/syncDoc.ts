export function syncDoc(info) {
    console.log(info);
    console.log(this);
    if (info.direction == 'pull') {
        const docs = info.change.docs;
        for (const doc of docs) {
            if (doc._deleted) {
                console.log(doc);
                this.removeObserver.notifyObservers({id: doc._id, template: doc.template}, 1);
            } else {
                this.updateObserver.notifyObservers(doc, 1);
            }

        }
    }

}
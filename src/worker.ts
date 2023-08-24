import {IndexdbPersistenceManager} from "./integration/indexdbPersistenceManager";
import {DiagramEvent, DiagramEventType} from "./diagram/diagramEntity";

const persistenceManager = new IndexdbPersistenceManager("diagram");

const ctx: Worker = self as any;


ctx.onmessage = (event) => {
    console.log(event.data);
    if (event.data.type == 'init') {
        persistenceManager.updateObserver.add((event) => {
            ctx.postMessage({entity: event});
        });
        persistenceManager.configObserver.add((event) => {
            ctx.postMessage({config: event});
        });
        persistenceManager.initialize().then(() => {
            console.log('initialized');
        });
    } else {
        const data = (event.data as DiagramEvent);
        switch (data.type) {
            case DiagramEventType.ADD:
                persistenceManager.add(data.entity);
                break;
            case DiagramEventType.MODIFY:
                persistenceManager.modify(data.entity);
                break;
            case DiagramEventType.REMOVE:
                persistenceManager.remove(data.entity.id);
                break;

        }
    }
};

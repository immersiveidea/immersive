import {IndexdbPersistenceManager} from "./integration/indexdbPersistenceManager";
import {DiagramEvent, DiagramEventType} from "./diagram/diagramEntity";

const persistenceManager = new IndexdbPersistenceManager("diagram");

const ctx: Worker = self as any;


ctx.onmessage = (event) => {
    console.log(event);

    if (event.data.type == 'init') {
        persistenceManager.updateObserver.add((event) => {
            console.log(event);
            ctx.postMessage({entity: event});
        });
        persistenceManager.configObserver.add((event) => {
            console.log(event);
            ctx.postMessage({config: event});
        });
        persistenceManager.initialize().then(() => {

        });
    } else {
        if (event.data.entity) {
            console.log(event.data);
            const data = (event.data.entity as DiagramEvent);
            switch (data.type) {
                case DiagramEventType.ADD:
                    persistenceManager.add(data.entity);
                    break;
                case DiagramEventType.DROP:
                case DiagramEventType.MODIFY:
                    persistenceManager.modify(data.entity);
                    break;
                case DiagramEventType.REMOVE:
                    persistenceManager.remove(data.entity.id);
                    break;

            }
        }
        if (event.data.config) {

            persistenceManager.setConfig(event.data.config);
        }


    }
};

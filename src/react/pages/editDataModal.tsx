import {Provider} from "use-pouchdb";

export default function EditDataModal({currentDb}) {
    if (currentDb) {
        return (
            <Provider pouchdb={currentDb}>

            </Provider>
        )
    } else {
        return <h1>Nothing Selected</h1>
    }
}
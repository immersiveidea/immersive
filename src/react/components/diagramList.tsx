import {useEffect, useState} from "react";

export function DiagramList({display, onClick}) {
    const [dbList, setDbList] = useState([]);
    useEffect(() => {
        const listDb = async () => {
            const data = await indexedDB.databases();
            let i = 0;
            setDbList(data.filter((item) => item.name.indexOf('_pouch_') > -1).map((item) => {
                const dbid = item.name.replace('_pouch_', '');
                let friendlyName = localStorage.getItem(dbid);
                if (!friendlyName) {
                    friendlyName = dbid;
                }
                return {key: dbid, name: friendlyName}
            }));
        };
        listDb();
    }, []);


    return (
        <div className="overlay" id="diagramList" style={{'display': display}}>
            <h1>Diagrams</h1>
            <div id="startCreate"><a href="#" id="startCreateLink" onClick={onClick}>New</a></div>
            <div id="diagramListContent">
                <ul>
                    {dbList.map((item) => <li key={item.key}><a href={`/db/${item.key}`}>{item.name}</a></li>)}
                </ul>
            </div>
        </div>
    )
}
import {useEffect, useState} from "react";
import {uploadImage} from "./functions/uploadImage";

function MainMenu({onClick}) {
    return (
        <div className="overlay mini" id="main">
            <img height="120" src="/assets/ddd.svg" width="320"/>
            <div id="enterXR" className="inactive"><a href="#" id="enterVRLink">Enter VR</a></div>
            <QuestLink/>
            <div id="diagrams"><a href="#" id="diagramsLink" onClick={onClick}>Diagrams</a></div>
            <div id="imageUpload"><a href="#" id="imageUploadLink" onClick={onClick}>Upload Image</a></div>
            <div id="download"><a href="#" id="downloadLink">Download Model</a></div>
        </div>
    )
}

function CreateMenu({display, toggleCreateMenu}) {
    const onCreateClick = (evt) => {
        evt.preventDefault();
        const name = (document.querySelector('#createName') as HTMLInputElement).value;
        const id = window.crypto.randomUUID().replace(/-/g, '_');
        localStorage.setItem(id, name);
        if (name && name.length > 4) {
            document.location.href = '/db/' + id;
        } else {
            window.alert('Name must be longer than 4 characters');
        }
    }
    return (
        <div className="overlay" id="create" style={{'display': display}}>
            <div>
                <div><input id="createName" placeholder="Enter a name for your diagram" type="text"/></div>
                <div><a href="#" id="createActionLink" onClick={onCreateClick}>Create</a></div>
                <div><a className="cancel" onClick={toggleCreateMenu} href="#" id="cancelCreateLink">Cancel</a></div>
            </div>
        </div>
    )
}

function TutorialMenu({onClick}) {
    return (
        <div className="overlay" id="tutorial">
            <h1>Help</h1>
            <div id="desktopTutorial"><a href="#" id="desktopLink" onClick={onClick}>Desktop</a></div>
        </div>
    )
}

function KeyboardHelp({display, onClick}) {
    return (
        <div className="overlay" id="keyboardHelp" style={{'display': display}}>
            <div id="closekey"><a href="#" onClick={onClick}>X</a></div>
            <img height="240" src="/assets/textures/keyboardhelp2.jpg" width="480"/>
            <img height="240" src="/assets/textures/mousehelp.jpg" width="180"/>
        </div>
    )
}

function QuestLink() {
    const link = "https://www.oculus.com/open_url/?url=https://www.deepdiagram.com" + document.location.pathname;
    return (
        <div id="questLaunch">
            <a href={link} target="_blank">Launch On Quest</a>
        </div>
    )
}

function DiagramList({display, onClick}) {
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

function Menu() {

    const [createState, setCreateState] = useState('none');
    const [desktopTutorialState, setDesktopTutorialState] = useState('none');
    const [diagramListState, setDiagramListState] = useState('none');

    function handleCreateClick(evt: React.MouseEvent<HTMLAnchorElement>) {
        evt.preventDefault();
        setCreateState(createState == 'none' ? 'block' : 'none');
    }

    function handleDesktopTutorialClick(evt: React.MouseEvent<HTMLAnchorElement>) {
        evt.preventDefault();
        setDesktopTutorialState(desktopTutorialState == 'none' ? 'block' : 'none');
    }

    function handleDiagramListClick(evt: React.MouseEvent<HTMLAnchorElement>) {
        evt.preventDefault();
        if (!evt.currentTarget.id) {
            return;
        }
        switch (evt.currentTarget.id) {
            case 'imageUploadLink':
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = uploadImage;

                document.body.appendChild(input);
                input.click();
                break;
            default:
                setDiagramListState(diagramListState == 'none' ? 'block' : 'none');
        }
    }

    return (
        <div>
            <MainMenu onClick={handleDiagramListClick}/>
            <CreateMenu display={createState} toggleCreateMenu={handleCreateClick}/>
            <DiagramList onClick={handleCreateClick} display={diagramListState}/>
        </div>
    )
}

export default function WebApp() {
    return (
        <div>
            <Menu/>
        </div>
    )
}
import {useEffect, useState} from "react";

function MainMenu({onClick}) {
    return (
        <div className="overlay mini" id="main">
            <img height="120" src="/assets/ddd.svg" width="320"/>
            <div id="diagrams"><a href="#" id="diagramsLink" onClick={onClick}>Diagrams</a></div>
            <div id="enterXR"><a href="#" id="enterVRLink">Enter VR</a></div>
            <div id="download"><a href="#" id="downloadLink">Download Model</a></div>
        </div>
    )
}

function CreateMenu({display, toggleCreateMenu}) {
    const onCreateClick = (evt) => {
        evt.preventDefault();
        const name = (document.querySelector('#createName') as HTMLInputElement).value;
        if (name && name.length > 4) {
            document.location.href = '/db/' + name;
        } else {
            window.alert('Name must be longer than 4 characters');
        }
    }
    return (
        <div className="overlay" id="create" style={{'display': display}}>
            <div>
                <div><input id="createName" placeholder="Enter a name for your diagram" type="text"/></div>
                <div><input id="createPassword" placeholder="Enter a password (optional)" type="text"/></div>
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

function DiagramList({display, onClick}) {
    const [dbList, setDbList] = useState([]);
    useEffect(() => {
        const listDb = async () => {
            const data = await indexedDB.databases();
            let i = 0;
            setDbList(data.filter((item) => item.name.indexOf('_pouch_') > -1).map((item) => {
                return {key: i++, name: item.name.replace('_pouch_', '')}
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
                    {dbList.map((item) => <li key={item.key}><a href={`/db/${item.name}`}>{item.name}</a></li>)}
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
        setDiagramListState(diagramListState == 'none' ? 'block' : 'none');
    }

    return (
        <div>
            <MainMenu onClick={handleDiagramListClick}/>
            <TutorialMenu onClick={handleDesktopTutorialClick}/>
            <CreateMenu display={createState} toggleCreateMenu={handleCreateClick}/>
            <KeyboardHelp display={desktopTutorialState} onClick={handleDesktopTutorialClick}/>
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
/*
const create = document.querySelector('#startCreateLink');
    if (create) {
        create.addEventListener('click', function (evt) {
            evt.preventDefault();
            document.querySelector('#main').style.display = 'none';
            document.querySelector('#create').style.display = 'block';
        });
    }
    const cancel = document.querySelector('#cancelCreateLink');
    if (cancel) {
        cancel.addEventListener('click', function (evt) {
            evt.preventDefault();
            document.querySelector('#main').style.display = 'block';
            document.querySelector('#create').style.display = 'none';
        });
    }
    const close = document.querySelector('#closekey a');
    if (close) {
        close.addEventListener('click', function (evt) {
            evt.preventDefault();
            document.querySelector('#keyboardHelp').style.display = 'none';
        });
    }
    const desktopTutorial = document.querySelector('#desktopLink');
    if (desktopTutorial) {
        desktopTutorial.addEventListener('click', function (evt) {
            evt.preventDefault();
            // document.querySelector('#tutorial').style.display = 'none';
            document.querySelector('#keyboardHelp').style.display = 'block';
        });
    }
    const createAction = document.querySelector('#createActionLink');
    if (createAction) {
        createAction.addEventListener('click', function (evt) {
            evt.preventDefault();
            const value = document.querySelector('#createName').value;
            if (value && value.length > 4) {
                document.location.href = '/db/' + value;
            } else {
                window.alert('Name must be longer than 4 characters');
            }
        });
    }

 */
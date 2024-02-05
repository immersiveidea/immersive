import {useState} from "react";

function MainMenu({onClick}) {
    return (
        <div className="overlay mini" id="main" onClick={onClick}>
            <img height="120" src="/assets/ddd.svg" width="320"/>
            <div id="startCreate"><a href="#" id="startCreateLink">Start</a></div>
            <div id="download"><a href="#" id="downloadLink">Download Model</a></div>
        </div>
    )
}

function CreateMenu({display}) {
    return (
        <div className="overlay" id="create" style={{'display': display}}>

            <div>
                <div><input id="createName" placeholder="Enter a name for your diagram" type="text"/></div>
                <div><input id="createPassword" placeholder="Enter a password (optional)" type="text"/></div>
                <div><a href="#" id="createActionLink">Create</a></div>
                <div><a className="cancel" href="#" id="cancelCreateLink">Cancel</a></div>
            </div>

        </div>
    )
}

function TutorialMenu({onClick}) {
    return (
        <div className="overlay" id="tutorial">
            <h1>Help</h1>
            <div id="desktopTutorial"><a href="#" id="desktopLink" onClick={onClick}>Desktop</a></div>
            <div id="questTutorial"><a href="#" id="questLink">Quest</a></div>
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

function DiagramList() {
    return (
        <div className="overlay" id="diagramList" style={{'left': '500px'}}>
            <h1>Existing Diagrams</h1>
            <div id="diagramListContent">
                <ul>
                    <li><a href="/db/ddd">ddd</a></li>
                    <li><a href="/db/ddd2">ddd2</a></li>
                    <li><a href="/db/ddd3">ddd3</a></li>
                </ul>
            </div>
        </div>
    )
}

function Menu() {

    const [createState, setCreateState] = useState('none');
    const [desktopTutorialState, setDesktopTutorialState] = useState('none');

    function handleCreateClick() {
        setCreateState(createState == 'none' ? 'block' : 'none');
    }

    function handleDesktopTutorialClick() {
        setDesktopTutorialState(desktopTutorialState == 'none' ? 'block' : 'none');
    }

    return (
        <div>
            <MainMenu onClick={handleCreateClick}/>
            <TutorialMenu onClick={handleDesktopTutorialClick}/>
            <CreateMenu display={createState}/>
            <KeyboardHelp display={desktopTutorialState} onClick={handleDesktopTutorialClick}/>
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
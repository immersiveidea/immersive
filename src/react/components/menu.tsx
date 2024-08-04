import {useState} from "react";
import {uploadImage} from "../functions/uploadImage";
import {MainMenu} from "./mainMenu";
import {CreateMenu} from "./createMenu";
import {DiagramList} from "./diagramList";

export function Menu() {

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
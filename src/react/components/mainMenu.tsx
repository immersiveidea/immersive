import {viewOnly} from "../../util/functions/getPath";
import {QuestLink} from "./questLink";

export function MainMenu({onClick}) {
    if (viewOnly()) {
        return (
            <div className="overlay mini" id="main">
                <img alt="deep diagram logo" height="120" src="/assets/ddd.svg" width="320"/>
                <div id="enterXR" className="inactive"><a href="#" id="enterVRLink">Enter VR</a></div>
                <QuestLink/>
                <div id="download"><a href="#" id="downloadLink">Download Model</a></div>
            </div>)
    } else {
        return (
            <div className="overlay mini" id="main">
                <img alte="deep diagram logo" height="120" src="/assets/ddd.svg" width="320"/>
                <div id="enterXR" className="inactive"><a href="#" id="enterVRLink">Enter VR</a></div>
                <QuestLink/>

                <div id="diagrams"><a href="#" id="diagramsLink" onClick={onClick}>Diagrams</a></div>
                <div id="imageUpload"><a href="#" id="imageUploadLink" onClick={onClick}>Upload Image</a></div>
                <div id="download"><a href="#" id="downloadLink">Download Model</a></div>
            </div>
        )
    }

}
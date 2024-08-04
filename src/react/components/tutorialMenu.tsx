export function TutorialMenu({onClick}) {
    return (
        <div className="overlay" id="tutorial">
            <h1>Help</h1>
            <div id="desktopTutorial"><a href="#" id="desktopLink" onClick={onClick}>Desktop</a></div>
        </div>
    )
}
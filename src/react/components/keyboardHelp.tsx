export function KeyboardHelp({display, onClick}) {
    return (
        <div className="overlay" id="keyboardHelp" style={{'display': display}}>
            <div id="closekey"><a href="#" onClick={onClick}>X</a></div>
            <img alt="keyboard help" height="240" src="/assets/textures/keyboardhelp2.jpg" width="480"/>
            <img alt="mouse help" height="240" src="/assets/textures/mousehelp.jpg" width="180"/>
        </div>
    )
}
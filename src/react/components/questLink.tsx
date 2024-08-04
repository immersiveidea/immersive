export function QuestLink() {
    const link = "https://www.oculus.com/open_url/?url=https://www.deepdiagram.com" + document.location.pathname;
    return (
        <div id="questLaunch">
            <a href={link} target="_blank">Launch On Quest</a>
        </div>
    )
}

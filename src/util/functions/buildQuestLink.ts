export function buildQuestLink() {
    /*
    <div id="questLaunch"><a href="https://www.oculus.com/open_url/?url=https://www.deepdiagram.com/" target="_blank">Launch
  On Quest</a>
</div>
     */
    const div = document.createElement("div");
    div.id = "questLaunch";
    const a = document.createElement("a");
    a.href = "https://www.oculus.com/open_url/?url=" + window.location.href;
    a.target = "_blank";
    a.innerText = "Launch On Quest";
    div.appendChild(a);
    document.body.appendChild(div);

}
import {DefaultScene} from "../../defaultScene";

export function addSceneInspector() {
    const scene = DefaultScene.Scene;
    window.addEventListener("keydown", (ev) => {
        if (ev.key == "z") {
            //voiceManager.startRecording();
        }
        if (ev.key == "x") {
            //voiceManager.stopRecording();
        }
        if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
            import("@babylonjs/core/Debug").then(() => {
                import("@babylonjs/inspector").then(() => {
                    const web = document.querySelector('#webApp');
                    if (scene.debugLayer.isVisible()) {
                        if (web) {
                            (web as HTMLDivElement).style.display = 'block';
                        }
                        scene.debugLayer.hide();
                    } else {
                        scene.debugLayer.show();
                        if (web) {
                            (web as HTMLDivElement).style.display = 'none';
                        }
                    }
                });
            });
        }
    });
}
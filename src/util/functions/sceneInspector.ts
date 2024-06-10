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

            const web = document.querySelector('#webApp');
            (web as HTMLDivElement).style.display = 'none';

            import ("@babylonjs/inspector").then((inspector) => {
                inspector.Inspector.Show(DefaultScene.Scene, {
                    overlay: true,
                    showExplorer: true
                });
                const web = document.querySelector('#webApp');
                (web as HTMLDivElement).style.display = 'none';
            });
            /*import("@babylonjs/core/Debug").then(() => {
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
            });*/
        }
    });
}

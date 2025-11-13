import {DefaultScene} from "../../defaultScene";

export function addSceneInspector() {
    window.addEventListener("keydown", (ev) => {
        // Ctrl+Shift+I to open inspector
        if (ev.shiftKey && ev.ctrlKey && !ev.altKey && ev.keyCode === 73) {
            import ("@babylonjs/inspector").then((inspector) => {
                inspector.Inspector.Show(DefaultScene.Scene, {
                    overlay: true,
                    showExplorer: true
                });
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

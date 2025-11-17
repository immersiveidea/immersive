import {DefaultScene} from "../../defaultScene";
import {ResizeGizmo} from "../../gizmos/ResizeGizmo";

export function addSceneInspector() {
    window.addEventListener("keydown", (ev) => {
        // Ctrl+Shift+I to open inspector
        if (ev.ctrlKey) {

            switch (ev.key) {
                case 'I':
                    import ("@babylonjs/inspector").then((inspector) => {
                        inspector.Inspector.Show(DefaultScene.Scene, {
                            overlay: true,
                            showExplorer: true
                        });
                    });
                    break;
                case 'U':
                    import ("@babylonjs/inspector").then((inspector) => {
                        inspector.Inspector.Show(ResizeGizmo.utilityLayer.utilityLayerScene, {
                            overlay: true,
                            showExplorer: true
                        });
                    });
            }

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

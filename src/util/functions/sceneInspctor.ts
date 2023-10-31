export function addSceneInspector(scene) {
    window.addEventListener("keydown", (ev) => {
        if (ev.key == "z") {
            //voiceManager.startRecording();
        }
        if (ev.key == "x") {
            //voiceManager.stopRecording();
        }
        if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
            import("@babylonjs/core/Debug/debugLayer").then(() => {
                import("@babylonjs/inspector").then(() => {
                    if (scene.debugLayer.isVisible()) {
                        scene.debugLayer.hide();
                    } else {
                        scene.debugLayer.show();
                    }
                });
            });
        }
    });
}
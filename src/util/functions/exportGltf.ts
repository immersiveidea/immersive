import {DefaultScene} from "../../defaultScene";

export function exportGltf() {
    const scene = DefaultScene.scene;
    import("@babylonjs/serializers").then((serializers) => {
        serializers.GLTF2Export.GLBAsync(scene, 'diagram.glb', {
            shouldExportNode: function (node) {
                return (node?.metadata?.exportable as boolean);
            }
        }).then((gltf) => {
            gltf.downloadFiles();
        });
    });
}
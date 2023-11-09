import {Scene} from "@babylonjs/core";

export function exportGltf(scene: Scene) {
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
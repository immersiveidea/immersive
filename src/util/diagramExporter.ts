import {Scene} from "@babylonjs/core";

export class DiagramExporter {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public exportgltf() {
        import("@babylonjs/serializers").then((serializers) => {
            serializers.GLTF2Export.GLBAsync(this.scene, 'diagram.glb', {
                shouldExportNode: function (node) {
                    return (node?.metadata?.exportable as boolean);
                }
            }).then((gltf) => {
                gltf.downloadFiles();
            });

        });
    }
}
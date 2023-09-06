import {Scene} from "@babylonjs/core";

export class DiagramExporter {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public export() {
        import("@babylonjs/serializers").then((serializers) => {
            serializers.GLTF2Export.GLBAsync(this.scene, 'diagram.glb', {
                shouldExportNode: function (node) {
                    if (node?.metadata?.exportable) {
                        return true;
                    } else {
                        return false;
                    }

                }
            }).then((gltf) => {
                gltf.downloadFiles();
            });

        });
    }
}
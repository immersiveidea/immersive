import {DynamicTexture, MeshBuilder, StandardMaterial, TransformNode, Vector2, Vector3} from "@babylonjs/core";

export class RoundButton {
    private parent: TransformNode;

    constructor(parent: TransformNode, label: string, description: string, position: Vector2) {
        this.parent = parent;
        this.buildButton(label, description, position);
    }

    private buildButton(label: string, description: string, position: Vector2) {
        const button = MeshBuilder.CreateSphere(label, {diameter: .1}, this.parent.getScene());
        const descriptionPlane = MeshBuilder.CreatePlane(label, {width: .3, height: .1}, this.parent.getScene());
        button.parent = this.parent;
        button.position.y = position.y;
        button.position.x = position.x;
        descriptionPlane.parent = this.parent;
        descriptionPlane.position.y = position.y - .1;
        descriptionPlane.position.x = position.x;

        const descTexture = new DynamicTexture('texture_desc_' + label, {
            width: 768,
            height: 256
        }, this.parent.getScene());
        const descMaterial = new StandardMaterial('button_desc_' + label)
        descriptionPlane.material = descMaterial;
        descMaterial.diffuseTexture = descTexture;
        descTexture.drawText(description, null, null, 'bold 64px Arial',
            '#000000', '#ffffff', true);

        const texture = new DynamicTexture('texture_' + label, {width: 256, height: 256}, this.parent.getScene());
        const material = new StandardMaterial('button_' + label)
        button.material = material;
        material.diffuseTexture = texture;
        texture.drawText(label, null, null, 'bold 128px Arial',
            '#000000', '#ffffff', true);

        button.scaling = new Vector3(.1, 1, 1);
        button.rotation.y = Math.PI / 2;
        button.rotation.z = Math.PI;
    }

}
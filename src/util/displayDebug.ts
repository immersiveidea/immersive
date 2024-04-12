import {
    AbstractMesh,
    DynamicTexture,
    Material,
    MeshBuilder,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";

const debug = false;

export function displayDebug(transform: TransformNode) {
    if (debug) {
        const position = `position: (${transform.position.x.toFixed(2)}, ${transform.position.y.toFixed(2)}, ${transform.position.z.toFixed(2)})`;
        const rotation = `rotation: (${transform.rotation.x.toFixed(2)}, ${transform.rotation.y.toFixed(2)}, ${transform.rotation.z.toFixed(2)})`;
        buildText(position, transform, new Vector3(0, 1.5, 1));
        buildText(rotation, transform, new Vector3(0, 1.4, 1));
    }


}

function buildText(text: string, transform: TransformNode, position) {
    const height = 0.05;
    const font_size = 24;
    const font = "bold " + font_size + "px Arial";
    //Set height for dynamic texture
    const DTHeight = 1.5 * font_size; //or set as wished
    //Calc Ratio
    const ratio = height / DTHeight;

    //Use a temporary dynamic texture to calculate the length of the text on the dynamic texture canvas
    const temp = new DynamicTexture("DynamicTexture", 32, transform.getScene());
    const tmpctx = temp.getContext();
    tmpctx.font = font;
    const DTWidth = tmpctx.measureText(text).width + 8;

    //Calculate width the plane has to be
    const planeWidth = DTWidth * ratio;

    //Create dynamic texture and write the text
    const dynamicTexture = new DynamicTexture("DynamicTexture", {
        width: DTWidth,
        height: DTHeight
    }, transform.getScene(), false);
    const mat = new StandardMaterial("mat", transform.getScene());
    mat.diffuseTexture = dynamicTexture;
    //mat.emissiveColor = Color3.White();
    dynamicTexture.drawText(text, null, null, font, "#000000", "#ffffff", true);
    //Create plane and set dynamic texture as material
    //const plane = MeshBuilder.CreatePlane("text" + text, {width: planeWidth, height: height}, mesh.getScene());
    const plane1 = createPlane(mat, transform, text, planeWidth, height, position);
    const plane2 = createPlane(mat, transform, text, planeWidth, height, position);
    plane2.rotation.y = Math.PI;
}

function createPlane(mat: Material, transform: TransformNode, text: string, planeWidth: number, height: number, position): AbstractMesh {
    const plane = MeshBuilder.CreatePlane("text" + text, {width: planeWidth, height: height}, transform.getScene());

    plane.material = mat;
    //plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    plane.metadata = {exportable: false, label: false};

    //const yOffset = mesh.getBoundingInfo().boundingSphere.maximum.y;
    //plane.parent = mesh;
    //plane.scaling.y = (1 / mesh.scaling.y);
    //plane.scaling.x = (1 / mesh.scaling.x);
    //plane.scaling.z = (1 / mesh.scaling.z);
    //plane.position = transform.position.y = yOffset + (height * plane.scaling.y);
    plane.position = position;
    window.setTimeout(() => {
        plane.dispose();
    }, 5000);
    return plane;

}

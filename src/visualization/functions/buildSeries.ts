import {
    AbstractMesh,
    Color3,
    InstancedMesh,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {buildLabel} from "./buildLabel";
import {TimeseriesType} from "../timeseriesType";

export function buildSeries(parent: TransformNode, series: TimeseriesType, index: number, count: number, scale: number): void {
    const scene = parent.getScene();
    if (!scene) {
        return;
    }
    const labelWidth = 1 / count * .8;
    const material = new StandardMaterial(series.name + "-material", scene);
    const seriesMesh = MeshBuilder.CreatePlane(series.name, {width: labelWidth, height: 1, sideOrientation: Mesh.DOUBLESIDE}, scene);
    seriesMesh.material = material;
    seriesMesh.parent = parent;
    seriesMesh.position.x = .5 - (index / count) - (1 / count / 2);
    seriesMesh.position.y = .001;
    seriesMesh.rotation.x = Math.PI / 2;
    material.diffuseColor = Color3.Random();
    buildLabel(series.name, seriesMesh, labelWidth);
    buildValues(seriesMesh, series, scale);
}

function buildValues(parent: TransformNode, series: TimeseriesType, scale: number): void {
    const scene = parent.getScene();
    if (!scene) {
        return;
    }
    const valueCount = series.values.length;
    const valueStep = 1 / valueCount;
    let lastValue = null;
    const linepoints: Vector3[] = [];
    const basepoint = MeshBuilder.CreatePlane(series.name + "-value-base", {height: .003, width: .01}, scene);

    basepoint.parent = parent;
    basepoint.material = (parent as AbstractMesh).material;
    basepoint.visibility = .5;
    series.values.forEach((value, index) => {
        //const point = MeshBuilder.CreateSphere(series.name + "-value-" + index, {diameter: .01}, scene);
        const point = new InstancedMesh(series.name + "-value-" + index, basepoint);
        point.parent = parent;
        //point.rotation.x = Math.PI/2;
        point.position.z = .5 - index * valueStep;
        point.position.y = value.value * scale;

        point.billboardMode = Mesh.BILLBOARDMODE_Y;
        linepoints.push(point.position.clone());
    });
    const line = MeshBuilder.CreateLines(series.name + "-line", {points: linepoints}, scene);
    line.color = ((parent as AbstractMesh).material as StandardMaterial).diffuseColor;
    line.parent = parent;
    line.isPickable = false;
    line.rotation.x = -Math.PI / 2;
}
import {CreateGreasedLine, Curve3, Vector3} from "@babylonjs/core";
import {DefaultScene} from "../defaultScene";

export default class CurveObject {
    constructor() {
        this._buildCurve();
    }

    private _buildCurve() {
        const origin = new Vector3(0, 0, 0);
        const control1 = new Vector3(0, 2, 0);
        const control2 = new Vector3(0, 5, -5);
        const end = new Vector3(0, 5, -8);
        const curve = Curve3.CreateCubicBezier(origin, control1, control2, end, 10);
        const path = curve.getPoints();
        const line = CreateGreasedLine("name", {points: path}, {}, DefaultScene.Scene);
    }
}

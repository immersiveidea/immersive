import {AbstractMesh, Observable, TransformNode} from "@babylonjs/core";

export class Controllers {
    public static movable: TransformNode | AbstractMesh;
    public static controllerObserver =  new Observable();

}
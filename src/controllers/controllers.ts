import {AbstractMesh, Observable, TransformNode} from "@babylonjs/core";

export type ControllerEventType = {
    type: string,
    value?: number,
    gripId?: string;
}
export class Controllers {
    public static movable: TransformNode | AbstractMesh;
    public static controllerObserver: Observable<ControllerEventType> = new Observable();
}
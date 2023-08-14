import {AbstractMesh, Observable, TransformNode} from "@babylonjs/core";

export type ControllerEventType = {
    type: string,
    value?: number,
    gripId?: string;
}
export class Controllers {
    public movable: TransformNode | AbstractMesh;
    public readonly controllerObserver: Observable<ControllerEventType> = new Observable();
}
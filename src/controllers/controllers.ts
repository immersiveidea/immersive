import {AbstractMesh, Observable, TransformNode} from "@babylonjs/core";

export enum ControllerMovementMode {
    ROTATE,
    TRANSLATE
}
export class MeshHoverEvent {
    public readonly mesh: AbstractMesh;
    public readonly pointerId: string;
    public readonly pointerMeshId: string;
    public readonly isHovered: boolean;
    constructor(mesh: AbstractMesh, isHovered: boolean, pointerId: string, pointerMeshId: string) {
        this.mesh = mesh;
        this.isHovered = isHovered;
        this.pointerId = pointerId;
        this.pointerMeshId = pointerMeshId;
    }
}
export class Controllers {
    public static movable: TransformNode | AbstractMesh;
    public static controllerObserver =  new Observable();
    public static movementMode: ControllerMovementMode = ControllerMovementMode.ROTATE;
    public static toggleMovementMode() {
        if (this.movementMode == ControllerMovementMode.ROTATE) {
            this.movementMode = ControllerMovementMode.TRANSLATE;
        } else {
            this.movementMode = ControllerMovementMode.ROTATE;
        }
    }
}
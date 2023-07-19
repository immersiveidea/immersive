
import {AbstractMesh, Observable, TransformNode} from "@babylonjs/core";

export enum ControllerMovementMode {
    ROTATE,
    TRANSLATE
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
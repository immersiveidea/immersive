import {AbstractMesh, Observable, TransformNode} from "@babylonjs/core";
import {ControllerEvent} from "./types/controllerEvent";


export var movable: TransformNode | AbstractMesh;
export const controllerObservable: Observable<ControllerEvent> = new Observable();
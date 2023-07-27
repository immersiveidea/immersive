import {AbstractMesh, Color3, Observable} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";

export interface IPersistenceManager {
    add(mesh: AbstractMesh);
    remove(mesh: AbstractMesh);
    modify(mesh: AbstractMesh);
    initialize();
    changeColor(oldColor: Color3, newColor: Color3)
    updateObserver: Observable<DiagramEntity>;

}

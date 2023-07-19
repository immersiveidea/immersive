import {AbstractMesh, Observable} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";

export interface IPersistenceManager {
    add(mesh: AbstractMesh);
    remove(mesh: AbstractMesh);
    modify(mesh: AbstractMesh);
    initialize();
    updateObserver: Observable<DiagramEntity>;

}

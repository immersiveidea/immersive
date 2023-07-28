import {AbstractMesh, Color3, Observable} from "@babylonjs/core";
import {DiagramEntity} from "./diagramEntity";
import {AppConfigType} from "../util/appConfig";

export interface IPersistenceManager {
    add(mesh: AbstractMesh);

    remove(mesh: AbstractMesh);

    modify(mesh: AbstractMesh);

    initialize();

    getConfig(): AppConfigType;

    setConfig(config: AppConfigType);

    changeColor(oldColor: Color3, newColor: Color3)

    updateObserver: Observable<DiagramEntity>;

}

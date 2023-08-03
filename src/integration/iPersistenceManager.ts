import {AbstractMesh, Color3, Observable} from "@babylonjs/core";
import {DiagramEntity} from "../diagram/diagramEntity";
import {AppConfigType} from "../util/appConfigType";

export enum DiagramListingEventType {
    GET,
    ADD,
    REMOVE,
    MODIFY
}

export type DiagramListingEvent = {
    type: DiagramListingEventType;
    listing: DiagramListing;
}
export type DiagramListing = {
    type: DiagramListingEvent;
    id: string;
    name: string;
    description?: string;
    sharekey?: string;

}

export interface IPersistenceManager {
    diagramListingObserver: Observable<DiagramListingEvent>;

    addDiagram(diagram: DiagramListing);

    removeDiagram(diagram: DiagramListing);

    add(mesh: AbstractMesh);

    remove(mesh: AbstractMesh);

    modify(mesh: AbstractMesh);

    initialize();

    setConfig(config: AppConfigType);

    modifyDiagram(diagram: DiagramListing);

    updateObserver: Observable<DiagramEntity>;
    configObserver: Observable<AppConfigType>;

    changeColor(oldColor: Color3, newColor: Color3);

    setCurrentDiagram(diagram: DiagramListing);
}

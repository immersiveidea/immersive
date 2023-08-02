import {Observable} from "@babylonjs/core";

export enum NetworkMessageType {
    DIAGRAM_EVENT = 'diagramEvent',
    CONNECTION_EVENT = 'connectionEvent',
}

class NetworkMessage {
    type: NetworkMessageType;
    data: any;
}

export interface INetworkConnection {
    onMessageObservable: Observable<NetworkMessage>;

    connect(name: string, room: string);

    disconnect();

}
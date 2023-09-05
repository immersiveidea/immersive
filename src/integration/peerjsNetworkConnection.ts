import P2PDataChannel from 'p2p-data-channel';
import log from "loglevel";
import {Observable} from "@babylonjs/core";
import {DiagramEvent, DiagramEventMask, DiagramEventType} from "../diagram/diagramEntity";

export class PeerjsNetworkConnection {
    private logger: log.Logger = log.getLogger('PeerjsNetworkConnection');
    private dataChannel: P2PDataChannel<any>;

    private readonly onDiagramEventObservable: Observable<DiagramEvent>;

    constructor(dataChannel: string, identity: string, onDiagramEventObservable: Observable<DiagramEvent>) {
        const config = {
            debug: false,
            dataChannel: dataChannel,
            connectionTimeout: 5000,
            pingInterval: 4000,
            pingTimeout: 8000,
            logLevel: 'debug',
        }
        this.onDiagramEventObservable = onDiagramEventObservable;
        this.dataChannel = new P2PDataChannel(identity, config);
        this.dataChannel.broadcast({'connect': identity});
        this.dataChannel.onConnected((peerId) => {
            this.logger.debug(peerId, ' connected');
            this.onDiagramEventObservable.notifyObservers({type: DiagramEventType.SYNC}, DiagramEventMask.REMOTE);
        });
        this.dataChannel.onMessage((message) => {
            this.logger.debug(message);
            if (message.sender !== this.dataChannel.localPeerId) {
                this.logger.debug(message.payload, ' received from ', message.sender);
                if (message.payload.request == 'join') {
                    this.dataChannel.send(message.sender, {type: 'join-ack'});
                    this.logger.debug('Join ack sent to ', message.sender);
                    this.onDiagramEventObservable.add((evt) => {
                        this.dataChannel.broadcast({diagramEvent: evt});
                    });

                }
                if (message.payload.diagramEvent) {
                    this.logger.debug('Received diagram event from ', message.sender, message.payload.diagramEvent);
                    const event = message.payload.diagramEvent;
                    if (event.type == DiagramEventType.DROP) {
                        event.type = DiagramEventType.MODIFY;
                    }
                    this.onDiagramEventObservable.notifyObservers(event, DiagramEventMask.REMOTE);
                }

            }
        });
    }

    public connect(host: string) {
        this.dataChannel.connect(host).then((peerId) => {
            this.logger.debug('Broadcasting Join', peerId);
            this.dataChannel.broadcast({request: 'join'});
        }).catch((err) => {
            this.logger.error(err);
        });

    }
}
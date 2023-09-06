import P2PDataChannel from 'p2p-data-channel';
import log from "loglevel";
import {Observable} from "@babylonjs/core";
import {DiagramEvent} from "../diagram/diagramEntity";


export class PeerjsNetworkConnection {
    private logger: log.Logger = log.getLogger('PeerjsNetworkConnection');
    private dataChannel: P2PDataChannel<any>;
    public readonly connectionObservable: Observable<any> = new Observable<any>;
    public readonly dataReplicationObservable: Observable<any> = new Observable<any>;
    public readonly diagramEventObservable: Observable<DiagramEvent> = new Observable<DiagramEvent>;

    constructor() {
        const config = {
            debug: false,
            dataChannel: 'deepSharedDiagram',
            connectionTimeout: 5000,
            pingInterval: 4000,
            pingTimeout: 8000,
            logLevel: 'debug',
        }

        // @ts-ignore
        const passphrase = window.niceware.generatePassphrase(6).join('-');
        this.logger.debug('Local Passphrase: ', passphrase);
        this.dataChannel = new P2PDataChannel(passphrase, config);
        this.dataChannel.onConnected((peerId) => {
            this.logger.debug('Connected to ', peerId);
            this.connectionObservable.notifyObservers(peerId);
        });
        this.dataChannel.onMessage((message) => {
            this.logger.debug(message);
            if (message.sender !== this.dataChannel.localPeerId) {
                this.logger.debug(message.payload, ' received from ', message.sender);
                if (message.payload.request == 'join') {
                    this.dataChannel.send(message.sender, {type: 'join-ack'});
                    this.logger.debug('Join ack sent to ', message.sender);
                }
                if (message.payload.diagramEvent) {
                    this.logger.debug('Received diagram event from ', message.sender, message.payload.diagramEvent);
                    this.diagramEventObservable.notifyObservers(message.payload.diagramEvent);
                }
            }
        });
        const remote = window.location.pathname.replace('/', '');
        if (remote && remote.length > 0) {
            this.connectToRemote(remote);

        } else {
            const link = 'https://www.oculus.com/open_url/?url=https://cameras.immersiveidea.com/';
            const linkEl = document.querySelector('#questLaunch a');
            linkEl.setAttribute('href', link + passphrase);
        }
        this.dataReplicationObservable.add((evt) => {
            this.logger.debug(evt);
            this.dataChannel.broadcast({diagramEvent: evt});
        });
    }

    public connectToRemote(host: string) {
        this.dataChannel.connect(host).then((peerId) => {
            this.logger.debug('Broadcasting Join', peerId);
            this.dataChannel.broadcast({request: 'join'});

        }).catch((err) => {
            this.logger.error(err);
        });
    }
}
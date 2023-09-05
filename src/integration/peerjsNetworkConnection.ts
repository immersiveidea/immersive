import P2PDataChannel from 'p2p-data-channel';
import log from "loglevel";
import {Observable} from "@babylonjs/core";
import {DiagramEvent, DiagramEventMask} from "../diagram/diagramEntity";

export class PeerjsNetworkConnection {
    private logger: log.Logger = log.getLogger('PeerjsNetworkConnection');
    private dataChannel: P2PDataChannel<any>;

    private readonly onDiagramEventObservable: Observable<DiagramEvent>;

    constructor(onDiagramEventObservable: Observable<DiagramEvent>) {
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
        this.onDiagramEventObservable = onDiagramEventObservable;
        this.dataChannel = new P2PDataChannel(passphrase, config);

        this.dataChannel.onConnected((peerId) => {
            this.logger.debug('Connected to ', peerId);
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
                    const event = message.payload.diagramEvent;
                    this.onDiagramEventObservable.notifyObservers(event, DiagramEventMask.REMOTE);
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
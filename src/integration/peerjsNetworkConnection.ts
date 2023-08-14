import P2PDataChannel from 'p2p-data-channel';
import log from "loglevel";

export class PeerjsNetworkConnection {
    private logger: log.Logger = log.getLogger('PeerjsNetworkConnection');
    private dataChannel: P2PDataChannel<any>;

    constructor(dataChannel: string, identity: string) {
        const config = {
            debug: false,
            dataChannel: dataChannel,
            connectionTimeout: 5000,
            pingInterval: 4000,
            pingTimeout: 8000
        }
        this.dataChannel = new P2PDataChannel(identity, config);
        this.dataChannel.onConnected((peerId) => {
            this.logger.debug(peerId, ' connected');
        });
        this.dataChannel.onMessage((message) => {
            if (message.sender !== this.dataChannel.localPeerId) {
                this.logger.debug(message.payload, ' received from ', message.sender);
            }
        });
    }

    public connect(host: string) {
        try {
            this.dataChannel.connect(host).then((peerId) => {
                this.logger.debug('Broadcasting Join', peerId);
                this.dataChannel.broadcast({payload: 'Joined'});
            });
        } catch (err) {
            this.logger.error(err);
        }
    }
}
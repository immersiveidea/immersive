import P2PDataChannel from 'p2p-data-channel';
import log from "loglevel";

export class PeerjsNetworkConnection {
    private logger: log.Logger = log.getLogger('PeerjsNetworkConnection');
    private dataChannel: P2PDataChannel<any>;

    constructor() {
        const config = {
            debug: false,
            dataChannel: 'default',
            connectionTimeout: 5000,
            pingInterval: 4000,
            pingTimeout: 8000
        }


        const data = window.location.search.replace('?', '')
            .split('&')
            .map((x) => x.split('='));
        this.dataChannel = new P2PDataChannel(data[0][1], config);

        this.dataChannel.onConnected((peerId) => {
            this.logger.debug(peerId, ' connected');
        });
        this.dataChannel.onMessage((message) => {
            this.logger.debug(message.payload, ' received from ', message.sender);
        });
        this.connect();

    }

    private async connect() {
        try {
            const data = window.location.search.replace('?', '')
                .split('&')
                .map((x) => x.split('='));
            const connection = await this.dataChannel.connect(data[1][1]).then(() => {
                console.log('Connected');
            });
            this.dataChannel.broadcast({payload: 'Hello World'});
        } catch (err) {
            this.logger.error(err);
        }
    }
}
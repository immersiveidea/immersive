import {RingApi} from "ring-client-api";

export class RingCamera {
    private ringApi: RingApi;

    constructor() {
        this.ringApi =  new RingApi({
            refreshToken: process.env.RING_TOKEN,
            cameraStatusPollingSeconds: 30,
            debug: true
        });

    }

    public async getCameras() {
        const cams = await this.ringApi.getCameras();
        const camid = cams.map((value) => value.id);
        return cams;
    }
}
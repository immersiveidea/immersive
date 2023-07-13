import {RingApi} from "ring-client-api";

export class RingCamera {
    private ringApi: RingApi;

    constructor() {
        const ringApi = new RingApi({
            refreshToken: process.env.RING_TOKEN,
            cameraStatusPollingSeconds: 30,
            debug: true
        });
        this.ringApi = ringApi;
    }

    public async getCameras() {
        const cams = await this.ringApi.getCameras();
        console.log(cams[0]);

        const camid = cams.map((value) => value.id);
        console.log(camid);
        return cams;
    }
}
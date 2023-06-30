import {RingCamera} from "../server/ring/ringCamera";

async (req, res) => {
    const cams = new RingCamera();
    const list = await  cams.getCameras();

    if (req.query.id) {
        const photoItem = list.filter(camera => camera.id == req.query.id);
        const photo = await photoItem[0].getSnapshot();
        res.contentType('image/jpg');
        res.send(photo);
    } else {
        const data = list.map((value) => {return {id: value.id, data: value.data}});
        res.contentType('application/json');
        res.send(data);
    }
}
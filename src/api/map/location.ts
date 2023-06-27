

export const GET = async (req, res, next) => {
    res.contentType('application/json');
    res.send('{"status": "OK"}');
}
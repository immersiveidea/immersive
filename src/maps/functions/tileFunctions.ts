export function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

export function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

const EARTH_CIR_METERS = 40075016.686;
const TILE_SIZE = 512;
const degreesPerMeter = 360 / EARTH_CIR_METERS;
const LIMIT_Y = toDegrees(Math.atan(Math.sinh(Math.PI))) // around 85.0511...

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return (radians / Math.PI) * 180
}


export function lonOnTile(lon, zoom) {
    return ((lon + 180) / 360) * Math.pow(2, zoom)
}

export function latOnTile(lat, zoom) {
    return (
        ((1 -
                Math.log(
                    Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
                ) /
                Math.PI) /
            2) *
        Math.pow(2, zoom)
    )
}
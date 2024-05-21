import * as mapTilerClient from '@maptiler/client';
import {
    AbstractMesh,
    MeshBuilder,
    Observable,
    Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector2,
    Vector3
} from "@babylonjs/core";
import {CameraIcon} from "./cameraIcon";

export type MaptilerMapTile = {
    lat: number,
    lon: number,
    zoom: number,
    url: string,
    x: number,
    y: number,
    bounds: Vector2[];
}


export class MaptilerMap {
    public readonly onReadyObservable = new Observable<MaptilerMapTile>();
    private _lat: number;
    private _lon: number;
    private _min: Vector2;
    private _max: Vector2;
    private _zoom: number;
    //private _bounds: Vector2[];
    private readonly _scene: Scene;
    private _tileXYCount: number = 2;
    private readonly _baseNode: TransformNode;
    private readonly _key: string;
    private _pendingPoints: Array<number> = [];
    private _points: Vector2[] = [];

    public constructor(key: string, scene: Scene, name: string = 'map-node', tileXYCount: number = 2) {
        this._scene = scene;
        this._key = key;
        this._tileXYCount = tileXYCount;
        this._baseNode = new TransformNode(name, this._scene);
        this.onReadyObservable.addOnce(this.buildNodes.bind(this));
        this.onReadyObservable.addOnce(this.waitForMeshAdded.bind(this));
    }

    private _startFallback: number = 10;

    public set startFallback(value: number) {
        this._startFallback = value;
    }

    private _fallbackInterval: number = 10;

    public set fallbackInterval(value: number) {
        this._fallbackInterval = value;
    }

    public get node(): TransformNode {
        return this._baseNode;
    }

    public async setLocation(name: string, zoom: number = 18): Promise<void> {
        mapTilerClient.config.apiKey = this._key;
        const result = await mapTilerClient.geocoding.forward(name)
        if (result.features.length > 0) {
            this.setInitialData(result.features[0].center[1], result.features[0].center[0], zoom);
            const tileXY = await this.getTileXY(this._lat, this._lon);
            const output = this.getTile(tileXY[0], tileXY[1], zoom);
            this.onReadyObservable.notifyObservers({
                lat: this._lat,
                lon: this._lon,
                zoom: zoom,
                x: tileXY[0],
                y: tileXY[1],
                url: output,
                bounds: []
            });
        } else {
            console.error(JSON.stringify(result));
        }
    }

    public async setLocationByLatLon(lat: number, lon: number, zoom: number = 18): Promise<void> {
        this.setInitialData(lat, lon, zoom);
        const tileXY = this.getTileXY(lat, lon);
        const imageUrl = this.getTile(tileXY[0], tileXY[1], zoom);
        this.onReadyObservable.notifyObservers({
            lat: this._lat,
            lon: this._lon,
            zoom: zoom,
            x: tileXY[0],
            y: tileXY[1],
            url: imageUrl,
            bounds: []
        });
    }

    public async plotPoint(lat: number, lon: number) {
        const len = this._points.push(new Vector2(lat, lon));
        this._pendingPoints.push(len - 1);
    }

    public getTile(x: number, y: number, z: number) {
        return `https://api.maptiler.com/maps/streets-v2/256/${z}/${x}/${y}@2x.png?key=${this._key}`;
    }

    private waitForMeshAdded() {
        this._scene.onAfterRenderObservable.add(() => {
            if (this._pendingPoints.length > 0) {
                this._pendingPoints = this._pendingPoints.filter((item) => {
                    const point = this._points[item];
                    const tileXY = this.getTileXY(point.x, point.y);
                    console.log(tileXY);
                    const mesh = this._scene.getMeshByName(`map-${tileXY[0]}-${tileXY[1]}-plane`);
                    const oldPoint = this._scene.getMeshByName(`map-${point.x}-${point.y}-point`);
                    if (!mesh) {
                        console.error(`map-${tileXY[0]}-${tileXY[1]}-plane not found`);
                        return true;
                    } else {
                        if (!oldPoint) {
                            const pixelx = lonOnTile(point.y, this._zoom) % 1;
                            const pixely = latOnTile(point.x, this._zoom) % 1;
                            console.log(`pixelx: ${pixelx}, pixely: ${pixely} found`);
                            try {
                                const newIcon = new CameraIcon(this._scene, this._baseNode,
                                    new Vector3(mesh.position.x - .5 + pixelx, mesh.position.y + .5 - pixely, mesh.position.z - .05));
                                return false;
                            } catch (err) {
                                return true;
                            }
                        } else {
                            return false;
                            //oldPoint.dispose(false, true);
                        }
                    }
                });
            }
        }, -1, false, this);
    }

    private buildNodes(data: MaptilerMapTile) {
        this.buildMapTile(0, 0, data.url, data.x, data.y).parent = this._baseNode;
        let time = this._startFallback;
        const tiles = this._tileXYCount;
        if (this._tileXYCount < 1) {
            return;
        }
        for (let x = -tiles; x < (tiles + 1); x++) {
            for (let y = -tiles; y < (tiles + 1); y++) {
                if (x !== 0 || y !== 0) {
                    const url = this.getTile(data.x + x, data.y + y, data.zoom);
                    window.setTimeout((that) => {
                        that.buildMapTile(x, -y, url, data.x + x, data.y + y).parent = this._baseNode;
                    }, time += this._fallbackInterval, this);
                }
            }
        }

    }

    private getTileXY(lat: number, lon: number): number[] {
        return [Math.floor(lonOnTile(lon, this._zoom)), Math.floor(latOnTile(lat, this._zoom))];
    }

    private setInitialData(lat: number, lon: number, zoom: number) {

        this._baseNode.getChildren().forEach((child) => {
            child.dispose(false, true);
        });
        this._lat = lat;
        this._lon = lon;
        this._zoom = zoom;
    }

    private buildMapTile(x: number, y: number, url: string, xTile: number, yTile: number): AbstractMesh {
        const map = MeshBuilder.CreatePlane(`map-${xTile}-${yTile}-plane`, {width: 1, height: 1}, this._scene);
        const mapMaterial = new StandardMaterial(`map-${xTile}-${yTile}-material`, this._scene);
        const mapTexture = new Texture(url, this._scene);
        const lon = tile2long(xTile, this._zoom);
        const lat = tile2lat(yTile, this._zoom);
        if (!this._min || lat < this._min.x || lon < this._min.y) {
            this._min = new Vector2(lat, lon);
            console.log(`min: ${lat}, ${lon}`);
        }
        const maxLat = tile2lat(yTile + 1, this._zoom);
        const maxLon = tile2long(xTile + 1, this._zoom);
        if (!this._max || maxLat > this._max.y || maxLon > this._max.y) {
            this._min = new Vector2(maxLat, maxLon);
            console.log(`max: ${maxLat}, ${maxLon}`);
        }
        map.metadata = {
            mapTile: {x: xTile, y: yTile}, bounds:
                {
                    topleft:
                        {lat: lat, lon: lon},
                    bottomright:
                        {
                            lat: tile2lat(yTile + 1, this._zoom),
                            lon: tile2long(xTile + 1, this._zoom)
                        }
                }
        };
        mapTexture.name = `map-${xTile}-${yTile}-texture`;
        mapMaterial.emissiveTexture = mapTexture;
        mapMaterial.disableLighting = true;
        mapMaterial.backFaceCulling = false;
        map.material = mapMaterial;
        map.position.x = x;
        map.position.y = y;
        map.isPickable = true;
        return map;
    }
}

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y, z) {
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


function lonOnTile(lon, zoom) {
    return ((lon + 180) / 360) * Math.pow(2, zoom)
}

function latOnTile(lat, zoom) {
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

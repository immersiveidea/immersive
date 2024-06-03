import * as mapTilerClient from '@maptiler/client';
import {
    AbstractMesh,
    ActionEvent,
    ActionManager,
    ExecuteCodeAction,
    MeshBuilder,
    Observable,
    Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector2,
} from "@babylonjs/core";
import log from "loglevel";
import {latOnTile, lonOnTile, tile2lat, tile2long} from "./functions/tileFunctions";

export type MaptilerMapTile = {
    lat: number,
    lon: number,
    zoom: number,
    url: string,
    x: number,
    y: number,
    bounds: Vector2[];
}
type PlotPointType = {
    position: Vector2;
    mesh: AbstractMesh;
}


export class MaptilerMap {
    public readonly onReadyObservable = new Observable<MaptilerMapTile>();
    public readonly onPickObservable: Observable<{ lat: number, lon: number }> = new Observable()
    private readonly _scene: Scene;
    private readonly _baseNode: TransformNode;
    private readonly _key: string;

    private _lat: number;
    private _lon: number;
    private _min: Vector2;
    private _max: Vector2;
    private _zoom: number;
    private _tileXYCount: number = 2;
    private _pendingPoints: Array<number> = [];
    private readonly _logger = log.getLogger('MaptilerMap');
    private _points: PlotPointType[] = [];
    private _actionManager: ActionManager;

    public constructor(key: string, scene: Scene, name: string = 'map-node', tileXYCount: number = 2) {
        this._scene = scene;
        this._key = key;
        this._tileXYCount = tileXYCount;
        this._baseNode = new TransformNode(name, this._scene);
        this.onReadyObservable.addOnce(this.buildNodes.bind(this));
        this.onReadyObservable.addOnce(this.waitForMeshAdded.bind(this));
        this._actionManager = new ActionManager(this._scene);
        this._actionManager.registerAction(new ExecuteCodeAction({trigger: ActionManager.OnPickDownTrigger},
            (evt: ActionEvent) => {
                const coordinates = evt.additionalData.getTextureCoordinates();
                const tile = evt.meshUnderPointer.metadata.mapTile;
                const lat = tile2lat(tile.y + (1 - coordinates.y), this._zoom);
                const lon = tile2long(tile.x + coordinates.x, this._zoom);
                this.onPickObservable.notifyObservers({lat: lat, lon: lon});
            })
        );
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
            this._logger.error(JSON.stringify(result));
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

    public async plotPoint(lat: number, lon: number, mesh: AbstractMesh) {
        const len = this._points.push({position: new Vector2(lat, lon), mesh: mesh});
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
                    const tileXY = this.getTileXY(point.position.x, point.position.y);
                    this._logger.log(tileXY);
                    const mesh = this._scene.getMeshByName(`map-${tileXY[0]}-${tileXY[1]}-plane`);
                    const oldPoint = this._scene.getMeshByName(`map-${point.position.x}-${point.position.y}-point`);
                    if (!mesh) {
                        this._logger.error(`map-${tileXY[0]}-${tileXY[1]}-plane not found`);
                        return true;
                    } else {
                        if (!oldPoint) {
                            const pixely = latOnTile(point.position.x, this._zoom) % 1;
                            const pixelx = lonOnTile(point.position.y, this._zoom) % 1;
                            this._logger.log(`pixelx: ${pixelx}, pixely: ${pixely} found`);
                            try {
                                const pointMesh = point.mesh;
                                pointMesh.parent = this._baseNode;
                                pointMesh.position.x = mesh.position.x - .5 + pixelx;
                                pointMesh.position.y = mesh.position.y + .5 - pixely;
                                pointMesh.position.z = mesh.position.z - .05;
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
        const tile = MeshBuilder.CreatePlane(`map-${xTile}-${yTile}-plane`, {width: 1, height: 1}, this._scene);
        const mapMaterial = new StandardMaterial(`map-${xTile}-${yTile}-material`, this._scene);
        const mapTexture = new Texture(url, this._scene);
        const lon = tile2long(xTile, this._zoom);
        const lat = tile2lat(yTile, this._zoom);
        if (!this._min || lat < this._min.x || lon < this._min.y) {
            this._min = new Vector2(lat, lon);
            this._logger.log(`min: ${lat}, ${lon}`);
        }
        const maxLat = tile2lat(yTile + 1, this._zoom);
        const maxLon = tile2long(xTile + 1, this._zoom);
        if (!this._max || maxLat > this._max.y || maxLon > this._max.y) {
            this._min = new Vector2(maxLat, maxLon);
            this._logger.log(`max: ${maxLat}, ${maxLon}`);
        }
        tile.metadata = {
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
        tile.material = mapMaterial;
        //tile.material.freeze();
        tile.position.x = x;
        tile.position.y = y;
        tile.renderOutline = true;
        tile.isPickable = true;
        tile.actionManager = this._actionManager;

        return tile;
    }
}


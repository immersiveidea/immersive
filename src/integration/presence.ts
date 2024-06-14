import {RingQueue, Websocket, WebsocketBuilder} from "websocket-ts";
import {getMe} from "../util/me";
import {UserModelType} from "../users/userTypes";
import log, {Logger} from "loglevel";
import {DefaultScene} from "../defaultScene";
import {Color3, MeshBuilder, StandardMaterial, TransformNode} from "@babylonjs/core";
import {xyztovec} from "../diagram/functions/vectorConversion";


export class Presence {
    private _logger: Logger = log.getLogger("Presence");
    private _ws: Websocket;
    private _id: string;

    constructor(id: string = null, db: string = null) {
        this._db = db;
        if (id == null) {
            const localMe = getMe();
            if (localMe != null) {
                this._id = localMe;
            }
        } else {
            this._id = id;
        }
        if (this._id != null) {
            this.build();
        } else {
            console.error('no user id found');
        }
    }

    private _db: string;

    public set db(db: string) {

        this._db = db;
    }

    public sendUser(user: UserModelType) {
        if (this._ws) {
            try {
                this._ws.send(JSON.stringify({'type': 'user', 'id': this._id, 'db': this._db, 'user': user}));
            } catch (err) {
                this._logger.error(err);
            }

        }

    }

    private build() {
        try {
            this._ws = new WebsocketBuilder("wss://presence.deepdiagram.com:443/")
                .withBuffer(new RingQueue(2))
                .onOpen(() => {
                    const me = {'type': 'connect', id: this._id};
                    this._ws.send(JSON.stringify(me));
                })
                .onClose(() => this._logger.debug("closed"))
                .onError(() => this._logger.debug("error"))
                .onMessage((i, ev) => {
                    this._logger.debug(i);
                    this._logger.debug(ev.data);
                    try {
                        const data = JSON.parse(ev.data);
                        switch (data.type) {
                            case 'connect':
                                break;
                            case 'ping':
                                if (data.db && data.id != this._id) {
                                    this._ws.send(JSON.stringify({'type': 'pong', 'id': this._id, 'db': this._db}));
                                }
                                break;
                            case'close':
                                const scene = DefaultScene.Scene;
                                const user = scene.getTransformNodeById(data.netAddr);
                                if (user) {
                                    user.dispose(false, true)
                                }
                                break;
                            case 'pong':
                                this._logger.debug(data);
                                break;
                            case 'user':
                                if (data.user) {
                                    if (data.user.id) {
                                        const scene = DefaultScene.Scene;
                                        if (scene) {
                                            const user = scene.getTransformNodeById(data.netAddr);
                                            if (user) {
                                                user.position = xyztovec(data.user.base.position);
                                                user.rotation = xyztovec(data.user.base.rotation);
                                            } else {
                                                this._logger.warn('user not found', data.user);
                                                const newUser = MeshBuilder.CreateDisc(data.user.id, {radius: 0.3}, scene);
                                                const node = new TransformNode(data.netAddr, scene);
                                                const material = new StandardMaterial(data.user.id + 'mat', scene);
                                                material.diffuseColor = new Color3(0, 0, 1);
                                                material.backFaceCulling = false;
                                                newUser.material = material;
                                                newUser.parent = node;
                                                newUser.rotation.x = Math.PI / 2;
                                                newUser.position.y = 0.01;
                                                node.position = xyztovec(data.user.base.position);
                                                node.rotation = xyztovec(data.user.base.rotation);
                                            }
                                        }
                                        this._logger.debug('user update', data.user);
                                    }

                                }
                        }

                    } catch (e) {
                        console.error(e);
                    }
                    this._logger.debug("message")
                })
                .onRetry(() => this._logger.debug("retry"))
                .onReconnect(() => this._logger.debug("reconnect"))
                .withProtocols("echo-protocol")
                .build();
            window.setInterval(() => {

                this._ws.send(JSON.stringify({'type': 'ping', 'id': this._id, db: this._db}));
            }, 15000, this);
            //this._ws.send(this._id);
        } catch (err) {
            this._logger.error(err);
            return;
        }
    }

}
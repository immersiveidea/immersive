import {AbstractMesh, MeshBuilder, Observable} from "@babylonjs/core";
import {UserModelType} from "./userTypes";
import {getMe} from "../util/me";
import {DefaultScene} from "../defaultScene";
import {vectoxys, xyztovec} from "../diagram/functions/vectorConversion";
import Peer, {PeerOptions} from "peer-lite";


export class UserManager {
    private readonly _onUserObservable: Observable<UserModelType>;
    private readonly _me: string;
    private _platform: AbstractMesh;
    private _myOldModel: UserModelType;
    private _turn_credentials: any;

    constructor(onUserObservable: Observable<UserModelType>) {
        //this.createRTCConnection();
        //this.createRTCConnection();


        //data.send('test');

        this._me = getMe();
        this._onUserObservable = onUserObservable;
        const scene = DefaultScene.Scene;
        let tick = 0;
        scene.onAfterRenderObservable.add(() => {
            tick++;
            if (!this._platform) {
                const platform = scene.getMeshById('platform');
                if (platform) {
                    this._platform = platform;
                }
            } else {
                if (tick % 10 == 0) {
                    if (!this._myOldModel ||
                        (this._myOldModel.base.position.x != this._platform.absolutePosition.x ||
                            this._myOldModel.base.position.y != this._platform.absolutePosition.y ||
                            this._myOldModel.base.position.z != this._platform.absolutePosition.z)) {
                        const me: UserModelType = {
                            id: this._me,
                            name: 'me',
                            type: 'user',
                            base: {
                                position: {x: 0, y: 0, z: 0},
                                rotation: {x: 0, y: 0, z: 0}
                            }
                        }
                        console.log(me);
                        me.base.position = vectoxys(this._platform.absolutePosition);
                        me.base.rotation = vectoxys(this._platform.absoluteRotationQuaternion.toEulerAngles());
                        this._myOldModel = me;
                        this._onUserObservable.notifyObservers(me);
                    }

                }
            }
        });
        this._onUserObservable.add((evt: UserModelType) => {
            if (evt.id != this._me) {
                const userMesh: AbstractMesh = scene.getMeshById(evt.id);
                if (!userMesh) {
                    const newMesh = MeshBuilder.CreateIcoSphere(evt.id, {radius: 0.1}, scene);
                    newMesh.position = xyztovec(evt.base.position);
                    console.log('creating mesh for user', evt);
                    // create mesh
                } else {
                    userMesh.position = xyztovec(evt.base.position);
                    console.log('updating mesh for user', evt);
                    // update mesh
                }
            }


            console.log(evt);
        });
        const me: UserModelType = {
            id: this._me,
            name: 'me',
            type: 'user',
            base: {
                position: {x: 0, y: 0, z: 0},
                rotation: {x: 0, y: 0, z: 0}
            }
        }
        this._onUserObservable.notifyObservers(me);
    }

    private async createRTCConnection2() {
        const credentials =
            {
                'iceServers': [{
                    'urls': [
                        "stun:stun.cloudflare.com:3478",
                        "turn:turn.cloudflare.com:3478?transport=udp",
                        "turn:turn.cloudflare.com:3478?transport=tcp",
                        "turns:turn.cloudflare.com:5349?transport=tcp"
                    ],
                    'username': "e56a6c7ad64e4d9f7ce1288cf716f4b0dd762053a748f4eecc377010de4bc59e295ad2776281a672e8f5c1c70b0d78e0",
                    'credential': "07963a124f189e6e0761c88b87fbf7d082701245db3cc4318b0973247964ee1a878def7a4ce4f48da259274bf7183bfd"
                }]
            };
        const options: PeerOptions = {
            enableDataChannels: true,
            config: credentials,
            id: this._me,

        }
        const peer = new Peer(
            options);
        peer.on('signal', async (description) => {
            console.log(description);
        });
        peer.on('connecting', async () => {
            console.log('connected');
        });
        peer.on('onicecandidates', async (candidate) => {
            console.log(candidate);
        })
        peer.addDataChannel('test');
        peer.send('test');
        peer.init();
        peer.start();
        const channel = peer.getDataChannel('test');

        channel.onopen = (evt) => {
            console.log(evt);
            channel.send(
                'test');

        };
        channel.onmessage = (evt) => {
            console.log(evt);
        }


    }


    private async createRTCConnection() {

        const credentials =
            {
                'iceServers': [{
                    'urls': [
                        "stun:stun.cloudflare.com:3478",
                        "turn:turn.cloudflare.com:3478?transport=udp",
                        "turn:turn.cloudflare.com:3478?transport=tcp",
                        "turns:turn.cloudflare.com:5349?transport=tcp"
                    ],
                    'username': "e56a6c7ad64e4d9f7ce1288cf716f4b0dd762053a748f4eecc377010de4bc59e295ad2776281a672e8f5c1c70b0d78e0",
                    'credential': "07963a124f189e6e0761c88b87fbf7d082701245db3cc4318b0973247964ee1a878def7a4ce4f48da259274bf7183bfd"
                }]
            };
        const rtc = new RTCPeerConnection(credentials);


        rtc.onconnectionstatechange = (evt) => {
            console.log(evt);
        };
        const data = rtc.createDataChannel('test');
        data.onopen = (evt) => {
            console.log(evt);
            data.send('hello');
        };
        rtc.onsignalingstatechange = (evt) => {
            console.log(evt);

        }

        const offer = await rtc.createOffer(
            {
                iceRestart: true,
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
        //const remote = await rtc.setRemoteDescription(offer);
        await rtc.setLocalDescription(offer);

        //await rtc.setRemoteDescription(offer);
        //const answer = await rtc.createAnswer();
        //console.log(answer);
        console.log('here');

        rtc.addEventListener('icecandidate', (evt) => {
            rtc.addIceCandidate(evt.candidate).then(() => {
                console.log(evt);

            }).catch(() => {

            });
        })
        //await rtc.setLocalDescription(answer);
        //await rtc.setRemoteDescription(answer);
    }
}


function onCatch(err) {
    console.log(err);
}
import RecordRTC from 'recordrtc';
import log from "loglevel";
import {Observable} from "@babylonjs/core";
import {TranscriptType, VoiceTranscript} from "./voiceTranscript";

type VoiceManagerEvent = {
    audio_start?: number;
    audio_end?: number;
    confidence?: number;
    text?: string;
    words?: Array<any>;
    created?: string;
    message_type?: string
}

export class VoiceManager {
    private socket: WebSocket;
    private token: string;
    public readonly transcriptionObserver: Observable<VoiceTranscript> = new Observable<VoiceTranscript>();
    private recorder: RecordRTC;
    private data: any[] = [];
    private logger = log.getLogger('VoiceManager');

    constructor() {
        this.setupRecorder();
    }

    public startRecording() {
        this.connectToVoice();
    }

    public stopRecording() {
        this.recorder.reset();
        this.socket.send('{"terminate_session": true}');
        this.socket = null;
    }

    public async connectToVoice() {
        const response = await fetch('/.netlify/functions/voice');
        const data = await response.json();
        this.token = data.token;
        if (!this.socket) {
            this.socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${this.token}`);
            this.socket.onmessage = this.messageRecieved;
            this.socket.onopen = this.socketOpen;
            this.socket.onclose = this.socketClose;
        } else {
            switch (this.socket.readyState) {
                case 0:
                    this.logger.debug('socket opening');
                    break;
                case 1:
                    this.logger.debug('socket already open');
                    //await this.recorder.startRecording();
                    break;
                case 2:
                    this.logger.debug('socket is closing');
                    this.socket = null;
                    //await this.setupConnection();
                    break;
                case 3:
                    this.logger.debug('Socket is closed');
                    this.socket = null;
                    //await this.setupConnection();
                    break
                default:
                    this.logger.debug(`socket state is unknown: ${this.socket.readyState}`);
            }

        }
    }

    private async setupRecorder() {
        if (!this.recorder) {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            this.recorder = new RecordRTC(stream, {
                type: 'audio', mimeType: 'audio/webm;codecs=pcm', // endpoint requires 16bit PCM audio
                recorderType: RecordRTC.StereoAudioRecorder, timeSlice: 300, // set 250 ms intervals of data that sends to AAI
                desiredSampRate: 16000, numberOfAudioChannels: 1, // real-time requires only one channel
                bufferSize: 4096, audioBitsPerSecond: 128000, ondataavailable: (blob) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64data: string = (reader.result as string);
                        // audio data must be sent as a base64 encoded string
                        if (this.socket && (this.socket.readyState === 1)) {
                            this.socket.send(JSON.stringify({audio_data: base64data.split('base64,')[1]}));
                        } else {
                            this.logger.warn('no socket available');
                        }
                    };
                    reader.readAsDataURL(blob);
                },
            });
        }
    }

    private messageRecieved = (message: any) => {
        const res = (JSON.parse(message.data) as VoiceManagerEvent);
        if (this.data) {
            //this.logger.debug(`Received data: ${JSON.stringify(res)}`);
            switch (res.message_type) {
                case 'PartialTranscript':
                    if (res.words.length > 0) {
                        this.logger.debug(`PartialTranscript: ${res.text}`);
                        this.transcriptionObserver.notifyObservers(
                            {
                                text: res.text, words: res.words, confidence: res.confidence,
                                type: TranscriptType.PartialTranscript
                            });
                    }

                    break;
                case 'FinalTranscript':
                    if (res.words.length > 0) {
                        this.transcriptionObserver.notifyObservers(
                            {
                                text: res.text, words: res.words, confidence: res.confidence,
                                type: TranscriptType.FinalTranscript
                            });
                    }

                    break;
                case 'SessionBegins':
                    this.logger.debug(`SessionBegins: ${res}`);
                    break;
            }
        }
    }

    private socketClose = async () => {
        this.logger.debug('Socket closed');
        this.socket = null;
        this.recorder.reset();
    }

    private socketOpen = async () => {
        this.logger.debug('voice socket opened');
        if (!this.recorder) {
            this.logger.error('recorder not initialized');
        } else {
            this.recorder.startRecording();
        }

    }
}
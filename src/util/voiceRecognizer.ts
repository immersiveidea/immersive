import {VuMeterEngine, WebVoiceProcessor} from "@picovoice/web-voice-processor";
import {EagleProfilerWorker, EagleWorker} from "@picovoice/eagle-web";
import {PvEngine} from "@picovoice/web-voice-processor/dist/types/types";
import {base64} from "rfc4648";
import {CobraWorker} from "@picovoice/cobra-web";

export class VoiceRecognizer {

    private readonly profile = 'TT4GLAFik3sHYasWTbmNc7CX2xmJifp897E6xyJDwcD8rHA1ZgJTdLaLQ0Z1zJP3Lzv61JMJpuNsgSSxraWf62RECXJHA4SJ5RCSv3/MHXcnKlaGzcQ4gJD/vcl8tL45j02me6lNf1TtbI81qv/GBSH9u3p5V/p7fD1j/tZ8P3kzM40FG1QxP330Sp/dvSwU6oEc5iH7+D3Zsy4GEtD3iqGdAex4200elW753eXlKli92qLlaplDxCZZIwNG0/ER51NhVzg/D+ieZLE/rUjZAl+z4a9c7AurnQDTZ1fKyzwMzjiQsb8h6rIco+IlblAuE8dmVfFxZXrpfw8tViK5KwnpbHrnR8ebLA0Zd/G5l0yjXeCEh8Y26qkGZk43MolBgQ044KNNsJbDrm1o2sYGvo/BgEronFuBB+wNw0pVFqp1nrIqfT8IsH42q4rj7ByzxH+4QVr1uQVx7c89GTp1yYyqk+q9B+f0cG063KwnUofddkx0tmot3d8kPCZGL1H88qMm2NdNeCU6AFi1qhP1Ssd3jOsyzd4O3U9JMJIUruySzf6Qx3/JI4aSKJm0To/xEszrm028s1qD8I0+Kh3GxgtiW+toCzJrAIoRkxmIgV2HbOStjerTQDK2t1MMHpHEr7NfNaJxxripR2xDlw/r1Sh2sf58AhIYBk1b/U54PCsm7tWKc0YroWgO5qSpASdkIq2UX7AgQ6nWtcZPk5d5xdfRkhIy3Yf6yushwEz/+v3aa/fshkh9lbKnz2wt4MhmbMJv7WYenHQr0RvEDQFchNHUyx8D7fBLpKwrmHVDi0meG7pl0Q9DrFzykeBZi0m22T6xF5OUBqvUZWdcqa5ZoYvPZS5Uk0d3COhAGjgFEAL7IMK9rZei24mM98+vqyfD1RRK29rQFljHxO9lJ0N3NINW2PfZulPPqn0OtEhxU829W1k1JjOUgOucJUpI9D0H1vrcqTYq0F4mj3YTqJ0CNbqXEan+XlbjB6kGKDuO1V/YkLbShJRnmKVtaCS2m4zDCJ5Rc7x8J7E/Cx6AnVK7UWM9CLnnLoaJ6sib9UnBV1uSTK2BIp1mO8b+BjP2yJ2/l1xbYUPZQa/ECRarwDP9PY9lHym6WGf35BjuWBwxT6obifw9JyYaqFZxwNbKviqKshSW8wmh5euYu3s0hY/MhCD+ZCYZiJAXADArcv8z8Wlk1x/KmZwLOAKJfgDUcs+9Q8aKGq5/jTPcd6MuM5pAVwfoFMR9QD8uKmyrPuBdJMRZFULX0uqliyna2CTmsAJ+6B47AA61q1/50Vj8OTUBLi+fhIaw3Ch1ofMYopIqc+QT81ekH8b9/+pXaUi+moA6C53Mnch9hB/uKoJELPSNDpIy1fP08Ujv/K0Foft4X43w9dImveOEhw==';

    public constructor() {
        this.start();

    }

    public async start() {
        let voicePresent = false;
        const eagleProfiler = await EagleProfilerWorker.create(
            'qQG03oXEGQRfPbX7H1VTZHLy/zelmMxcWXSy14/pskqri4LTJvBWmQ==',
            {publicPath: '/voice/eagle_params.pv'}
        )
        const bytes = base64.parse(this.profile);

        const eagle = await EagleWorker.create('qQG03oXEGQRfPbX7H1VTZHLy/zelmMxcWXSy14/pskqri4LTJvBWmQ=='
            , {publicPath: '/voice/eagle_params.pv'},
            [{bytes: bytes}]);
        let data: Int16Array = null;
        const engine: PvEngine = {
            onmessage: async (e: MessageEvent) => {
                if (!voicePresent) {
                    return;
                }
                switch (e.data.command) {
                    case 'process':
                        const inputData = e.data.inputFrame;

                        const validation = await eagle.process(inputData);
                        if (validation && validation[0] > .99) {


                        }


                        if (data == null) {
                            data = inputData;
                        } else {
                            data = new Int16Array(data.length + inputData.length);
                            data.set(data, 0);
                            data.set(inputData, data.length - inputData.length);
                        }
                        if (data.length > eagleProfiler.minEnrollSamples) {
                            const result = await eagleProfiler.enroll(data);
                            if (result.percentage >= 100) {


                                const profile = await eagleProfiler.export();
                                //console.log(profile.bytes.buffer);

                                //console.log(profile.bytes);
                                //console.log(profile.bytes.buffer.toString('base64'));
                                //console.log(profile);
                                //WebVoiceProcessor.unsubscribe(engine);
                                //WebVoiceProcessor.unsubscribe(engine);
                                //eagleProfiler.release();


                            }

                        }

                        break;
                }
            }
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach((device) => {
            if (device.kind === 'audioinput') {

            }
        });
        const vuCallback = (db) => {

        }
        WebVoiceProcessor.setOptions({deviceId: 'default'});
        const vuEngine = new VuMeterEngine(vuCallback);
        //WebVoiceProcessor.subscribe(vuEngine);
        const cobra = await CobraWorker.create('qQG03oXEGQRfPbX7H1VTZHLy/zelmMxcWXSy14/pskqri4LTJvBWmQ==',
            (isVoice) => {
                voicePresent = (isVoice && isVoice > .85);
            });
        WebVoiceProcessor.subscribe(cobra);
        WebVoiceProcessor.subscribe(engine);
    }
}


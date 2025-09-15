import {
    Color3, Engine, Scene, WebGPUEngine
} from "@babylonjs/core";
import { DefaultScene } from "../defaultScene";
import log from "loglevel";

export interface EngineInitializerParams {
    canvas: HTMLCanvasElement;
    useWebGpu: boolean;
    onSceneReady: (scene: Scene) => Promise<void>;
}

export async function initializeEngine(params: EngineInitializerParams): Promise<Engine | WebGPUEngine> {
    const logger = log.getLogger('EngineInitializer');

    if (!params.canvas) {
        logger.error('Canvas not found');
        return null;
    }

    let engine = null;
    if (params.useWebGpu) {
        engine = new WebGPUEngine(params.canvas);
        await (engine as WebGPUEngine).initAsync();
    } else {
        engine = new Engine(params.canvas, true);
    }

    engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
    const scene = new Scene(engine);
    DefaultScene.Scene = scene;
    scene.ambientColor = new Color3(.1, .1, .1);

    await params.onSceneReady(scene);

    engine.runRenderLoop(() => {
        scene.render();
    });

    return engine;
}

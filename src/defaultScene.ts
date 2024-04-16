import {Scene} from "@babylonjs/core";
import log from "loglevel";

const logger = log.getLogger('DefaultScene');
export class DefaultScene {
    private static _scene: Scene;

    public static get scene(): Scene {
        return DefaultScene._scene;
    }

    static create(scene: Scene) {
        if (DefaultScene._scene) {
            logger.error('default scene already created, disposing and recreating');
            if (DefaultScene._scene.isDisposed) {
                logger.warn('default scene is already disposed');
            } else {
                DefaultScene._scene.dispose();
                logger.info('default scene disposed');
            }

            DefaultScene._scene = null;
        }
        DefaultScene._scene = scene;
        logger.info('default scene created');
    }
}
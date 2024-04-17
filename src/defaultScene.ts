import {Engine, Scene} from "@babylonjs/core";
import log from "loglevel";

const logger = log.getLogger('DefaultScene');
export class DefaultScene {
    private static _Scene: Scene;

    public static get Scene(): Scene {
        if (!DefaultScene._Scene) {
            logger.error('default scene not yet created');
            if (Engine.LastCreatedScene) {
                logger.warn('using last created scene, this may not be what you want, proceed with caution');
                DefaultScene._Scene = Engine.LastCreatedScene;
                return DefaultScene._Scene;
            } else {
                return null;
            }
        } else {
            return DefaultScene._Scene;
        }
    }

    public static set Scene(scene: Scene) {
        if (DefaultScene._Scene) {
            logger.error('default scene already created, disposing and recreating');
            if (DefaultScene._Scene.isDisposed) {
                logger.warn('default scene is already disposed');
            } else {
                DefaultScene._Scene.dispose();
                logger.info('default scene disposed');
            }

            DefaultScene._Scene = null;
        }
        DefaultScene._Scene = scene;
        logger.info('default scene created');
    }
}
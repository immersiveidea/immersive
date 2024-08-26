import log from "loglevel";


export function motionControllerInitObserver(init) {
    const logger = log.getLogger('motionControllerObserver');
    logger.debug(init.components);
    if (init.components['xr-standard-squeeze']) {
        this.initGrip(init.components['xr-standard-squeeze'])
    }
    if (init.components['xr-standard-trigger']) {
        this.initClicker(init.components['xr-standard-trigger']);
    }
}

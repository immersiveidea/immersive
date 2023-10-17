export function wheelHandler() {
    this.upDownWheel = false;
    this.fowardBackWheel = false;
    this.rig.updown(0);
    this.rig.forwardback(0);
}
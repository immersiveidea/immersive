export class Amenu {
    private visible = false;
    constructor() {

    }
    public toggle() {
        this.visible = !this.visible;
    }
}
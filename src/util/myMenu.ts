import {PlanePanel} from "@babylonjs/gui";

export class MyMenu extends PlanePanel {
    public arrangeChildren: boolean = true;
    protected _arrangeChildren() {
        if (this.arrangeChildren) {
            super._arrangeChildren();
        }
    }
}
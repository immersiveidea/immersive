import {Button3D, TextBlock} from "@babylonjs/gui";
import {Vector3} from "@babylonjs/core";

export function makeButton(id: string, name: string): Button3D {
    const button = new Button3D(name);
    button.scaling = new Vector3(.1, .1, .1);
    button.name = id;
    const text = new TextBlock(name, name);
    text.fontSize = "48px";
    text.color = "#ffffee";
    text.alpha = 1;
    button.content = text;
    return button;
}
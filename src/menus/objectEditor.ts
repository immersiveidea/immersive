import {AdvancedDynamicTexture, Button, Control, Slider, StackPanel} from "@babylonjs/gui";
import {Angle, Mesh} from "@babylonjs/core";

export class ObjectEditor {
    private scene;
    private editor: Mesh;
    private mesh;
    constructor(scene, mesh) {
        this.scene=scene;
        this.mesh = mesh;
        this.edit();
    }
    public edit() {
        this.editor = Mesh.CreatePlane("editor", 2, this.scene);
        this.editor.position.z = -2;
        this.editor.position.y = 2;
        this.editor.rotation.y = Angle.FromDegrees(180).radians();
        const texture = AdvancedDynamicTexture.CreateForMesh(this.editor);
        const panel = new StackPanel();

        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        panel.width='100%';
        panel.height='100%';
        texture.addControl(panel);
        const x = this.createControl();

        const y = this.createControl();
        const z = this.createControl()
        const myMesh = this.mesh;
        z.value = myMesh.scaling.z;
        z.onValueChangedObservable.add((value)=> {
            myMesh.scaling.z = value;
        });
        y.onValueChangedObservable.add((value)=> {
            myMesh.scaling.y = value;
        });
        y.value = myMesh.scaling.x;
        x.onValueChangedObservable.add((value)=> {
            myMesh.scaling.x = value;
        });
        x.value = myMesh.scaling.x;
        panel.addControl(x);
        panel.addControl(y);
        panel.addControl(z);
        const button1 = Button.CreateSimpleButton("close-editor", "Close");
        button1.height = '20px';
        button1.background = "#FFF";
        panel.addControl(button1);
        button1.onPointerClickObservable.add(()=> {
            this.close();
        }, -1, false, this);
    }
    createControl(): Slider {
        const slider = new Slider();
        slider.minimum = .1
        slider.maximum = 10;
        slider.height = '40px';
        slider.step =.1
        return slider;
    }
    close() {
        this.editor.dispose();
        this.mesh=null;
        this.scene=null;
    }

}
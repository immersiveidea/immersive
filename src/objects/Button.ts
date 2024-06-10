import {
    AbstractMesh,
    ActionEvent,
    ActionManager,
    Color3,
    DynamicTexture,
    ExecuteCodeAction,
    ICanvasRenderingContext,
    MeshBuilder,
    Observable,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {split} from "canvas-hypertxt";

export type ButtonOptions = {
    width?: number,
    height?: number,
    background?: Color3,
    color?: Color3,
    hoverBackground?: Color3,
    hoverColor?: Color3,
    clickBackground?: Color3,
    clickColor?: Color3,
    fontSize?: number
}

enum states {
    NORMAL,
    HOVER,
    CLICK
}

export class Button {
    public onPointerObservable: Observable<ActionEvent> = new Observable<ActionEvent>();
    private _scene: Scene;
    private _mesh: AbstractMesh;
    private readonly _width: number;
    private readonly _height: number;
    private _background: Color3;
    private _color: Color3;
    private _hoverBackground: Color3;
    private _hoverColor: Color3;
    private _clickBackground?: Color3;
    private _clickColor?: Color3;
    private _textures: Map<states, DynamicTexture> = new Map<states, DynamicTexture>();
    private _fontSize: number;
    private readonly _density: number = 512;

    constructor(name: string, id: string, scene: Scene, options?: ButtonOptions) {
        this._scene = scene;
        const opts = defaultOptions(options);
        this.mapColors(options);
        this._width = opts.width;
        this._height = opts.height;
        this._mesh = MeshBuilder.CreatePlane(name, opts, scene);
        this._mesh.id = id;
        this._transform = new TransformNode(id, scene);
        this._mesh.parent = this._transform;
        this._mesh.rotate(Vector3.Up(), Math.PI);
        this._mesh.material = this.buildMaterial();
        this.registerActions();

    }

    private _transform: TransformNode;

    public get transform(): TransformNode {
        return this._transform;
    }

    static CreateButton(name: string, id: string, scene: Scene, options?: ButtonOptions): Button {
        const button = new Button(name, id, scene, options);
        return button;
    }

    public dispose() {
        this._mesh.dispose(false, true);
        this._transform.dispose(false, true);
        this.onPointerObservable.clear();
        this.onPointerObservable = null;
        this._transform = null;
        this._scene = null;
        this._mesh = null;
        this._textures.forEach((value) => {
            value.dispose();
        });
        this._textures.clear();
    }

    private mapColors(options?: ButtonOptions) {
        this._background = options?.background || Color3.Black();
        this._color = options?.color || Color3.White();
        this._hoverBackground = options?.hoverBackground || Color3.Gray();
        this._hoverColor = options?.hoverColor || Color3.White();
        this._clickBackground = options?.clickBackground || Color3.White();
        this._clickColor = options?.clickColor || Color3.Black();
        this._fontSize = options?.fontSize || 512;

    }

    private buildMaterial(): StandardMaterial {
        const mat = new StandardMaterial('buttonMat', this._scene);
        //mat.diffuseColor.set(.5, .5, .5);
        mat.backFaceCulling = false;
        this._textures.set(states.NORMAL, this.drawText(this._mesh.name, this._color, this._background));
        this._textures.set(states.HOVER, this.drawText(this._mesh.name, this._hoverColor, this._hoverBackground));
        this._textures.set(states.CLICK, this.drawText(this._mesh.name, this._clickColor, this._clickBackground));
        mat.emissiveTexture = this._textures.get(states.NORMAL);
        mat.opacityTexture = mat.emissiveTexture;
        mat.disableLighting = true;
        return mat;
    }

    private drawText(name: string, foreground: Color3, background: Color3): DynamicTexture {
        const opts = {width: this._width * this._density, height: this._height * this._density};
        const texture = new DynamicTexture('buttonTexture', opts, this._scene);

        const ctx: ICanvasRenderingContext = texture.getContext();
        const ctx2d: CanvasRenderingContext2D = (ctx.canvas.getContext('2d') as CanvasRenderingContext2D);
        const font = `900 ${this._fontSize / 10}px Arial`;
        ctx2d.font = font;
        ctx2d.textBaseline = 'middle';
        ctx2d.textAlign = 'center';
        ctx2d.roundRect(0, 0, this._width * this._density, this._height * this._density, 32);
        ctx2d.fillStyle = background.toHexString();
        ctx2d.fill();
        ctx2d.fillStyle = foreground.toHexString();
        const lines = split(ctx2d, name, font, this._width * this._density, true);
        const x = this._width * this._density / 2;
        let y = this._height * this._density / 2 - (lines.length - 1) * 50 / 2;
        for (const line of lines) {
            ctx2d.fillText(line, x, y);
            y += 50;
        }
        texture.update();
        return texture;
    }

    private registerActions() {
        const button = this._mesh;
        button.actionManager = new ActionManager(this._scene);
        button.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (evt) => {
            this.setMaterial(states.HOVER);
            this.onPointerObservable.notifyObservers(evt);
        }));
        button.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (evt) => {
            this.setMaterial(states.NORMAL);
            this.onPointerObservable.notifyObservers(evt);
        }));
        button.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (evt) => {
            this.setMaterial(states.CLICK);
            this.onPointerObservable.notifyObservers(evt);
        }));
        button.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickUpTrigger, (evt) => {
            this.setMaterial(states.HOVER);
            this.onPointerObservable.notifyObservers(evt);
        }));
        button.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (evt) => {
            this.setMaterial(states.NORMAL);
            this.onPointerObservable.notifyObservers(evt);
        }));
        button.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (evt) => {
            this.onPointerObservable.notifyObservers(evt);
        }));
    }

    private setMaterial(state: states) {
        if (this._mesh && this._mesh.material && this._textures.has(state)) {
            (this._mesh.material as StandardMaterial).emissiveTexture = this._textures.get(state);
        }
    }
}

function defaultOptions(options: ButtonOptions): ButtonOptions {
    if (!options) {
        options = {width: .5, height: .5};
    }
    if (!options.width) {
        options.width = .5;
    }
    if (!options.height) {
        options.height = .5;
    }
    return options;
}
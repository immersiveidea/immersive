import {PresentationStep} from "./presentationStep";
import log, {Logger} from "loglevel";
import {Scene} from "@babylonjs/core";
import {isDiagramEntity} from "./functions/isDiagramEntity";

export class PresentationManager {
    _currentStep: PresentationStep = null;
    private scene: Scene;
    private logger: Logger = log.getLogger("PresentationManager");

    constructor(scene: Scene) {
        this.scene = scene;
    }

    _steps: PresentationStep[] = [];

    public get steps(): PresentationStep[] {
        return this._steps;
    }

    public addStep(): PresentationStep {
        const step = new PresentationStep();
        this._currentStep = step;
        if (this._steps.length > 0) {
            this._steps[this._steps.length - 1].next = step;
        } else {
            this.scene.getActiveMeshes().forEach((mesh) => {
                if (isDiagramEntity(mesh)) {
                    step.entities.push({
                        entity: mesh,
                        endPosition: mesh.position.clone(),
                        endRotation: mesh.rotation.clone(),
                        endScaling: mesh.scaling.clone()
                    })
                    step.duration = 1;
                }
            });
        }
        this._steps.push(step);
        return step;
    }

    public play() {
        this._currentStep.play();
        if (this._currentStep.next) {
            this._currentStep = this._currentStep.next;
        }
    }

    public reset() {
        this._currentStep = this._steps[0];
        this._steps[0].play();
    }
}
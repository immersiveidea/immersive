import {AbstractMesh, Animation, Vector3} from "@babylonjs/core";

export type EntityTransform = {
    entity: AbstractMesh,
    endPosition?: Vector3,
    endRotation?: Vector3,
    endScaling?: Vector3
}

export class PresentationStep {
    public id: string;
    public name: string;
    public duration: number = 2;
    public entities: Array<EntityTransform> = [];
    public next: PresentationStep;
    private readonly fps: number = 30;

    private get endFrame(): number {
        return this.fps * this.duration;
    }

    public play() {
        this.entities.forEach((entityTransform) => {
            if (entityTransform.endPosition) {

                const transform = new Animation("transform", "position",
                    this.fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
                const keyframes = [
                    {frame: 0, value: entityTransform.entity.position},
                    {frame: this.endFrame, value: entityTransform.endPosition}
                ]
                transform.setKeys(keyframes);
                entityTransform.entity.animations.push(transform);
                entityTransform.entity.getScene().beginAnimation(entityTransform.entity, 0, this.endFrame, false);
            }
            if (entityTransform.endRotation) {
                //entityTransform.entity.rotation = entityTransform.endRotation;
            }
            if (entityTransform.endScaling) {
                //entityTransform.entity.scaling = entityTransform.endScaling;
            }
        });

    }
}
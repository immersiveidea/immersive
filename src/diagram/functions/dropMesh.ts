import {AbstractMesh, Vector3} from "@babylonjs/core";
import {DiagramManager} from "../diagramManager";
import {DiagramObject} from "../diagramObject";
import {MeshTypeEnum} from "../types/meshTypeEnum";
import {snapAll} from "../../controllers/functions/snapAll";
import {DiagramEvent, DiagramEventType} from "../types/diagramEntity";
import {DiagramEventObserverMask} from "../types/diagramEventObserverMask";
import {DefaultScene} from "../../defaultScene";
import {appConfigInstance} from "../../util/appConfig";
import {HandleConfig, Vec3} from "../../util/appConfigType";

export function dropMesh(mesh: AbstractMesh,
                         grabbedObject: DiagramObject,
                         pickPoint: Vector3,
                         grabbedMeshType: MeshTypeEnum,
                         diagramManager: DiagramManager): boolean {
    if (!mesh) {
        return false;
    }
    let dropped = false;
    const diagramObject = grabbedObject;
    switch (grabbedMeshType) {
        case MeshTypeEnum.ENTITY:
            if (diagramObject) {
                diagramObject.baseTransform.setParent(null);
                snapAll(grabbedObject.baseTransform, pickPoint);
                diagramObject.mesh.computeWorldMatrix(true);
                const event: DiagramEvent =
                    {
                        type: DiagramEventType.DROP,
                        entity: diagramObject.diagramEntity
                    }
                diagramManager.onDiagramEventObservable.notifyObservers(event, DiagramEventObserverMask.ALL);
                diagramObject.mesh.computeWorldMatrix(false);
                diagramObject.grabbed = false;
                dropped = true;
            }
            break;
        case MeshTypeEnum.TOOL:
            grabbedObject.baseTransform.setParent(null);
            snapAll(grabbedObject.baseTransform, pickPoint);
            diagramObject.mesh.computeWorldMatrix(true);
            const event: DiagramEvent =
                {
                    type: DiagramEventType.DROP,
                    entity: diagramObject.diagramEntity
                }
            diagramManager.onDiagramEventObservable.notifyObservers(event, DiagramEventObserverMask.ALL);
            diagramObject.mesh.computeWorldMatrix(false);
            grabbedObject.grabbed = false;
            dropped = true;
            break;
        case MeshTypeEnum.HANDLE:
            mesh.setParent(DefaultScene.Scene.getMeshByName("platform"));

            // Get existing handle config or create new one
            const existingConfig = appConfigInstance.getHandleConfig(mesh.id);

            // Convert Vector3 to Vec3 for serialization
            const position: Vec3 = {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            };
            const rotation: Vec3 = {
                x: mesh.rotation.x,
                y: mesh.rotation.y,
                z: mesh.rotation.z
            };

            const handleConfig: HandleConfig = {
                id: mesh.id,
                label: existingConfig?.label || mesh.id, // Preserve label if exists
                position: position,
                rotation: rotation,
                scale: existingConfig?.scale // Preserve scale if exists
            };

            // Save to AppConfig (which persists to localStorage)
            appConfigInstance.setHandleConfig(handleConfig);
            dropped = true;
            break;
    }
    return dropped;
}
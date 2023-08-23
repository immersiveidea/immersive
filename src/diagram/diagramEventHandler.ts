import {DiagramEvent, DiagramEventType} from "./diagramEntity";
import log from "loglevel";
import {applyPhysics} from "./functions/diagramShapePhysics";
import {ActionManager, Color3, PhysicsMotionType, Scene} from "@babylonjs/core";
import {TextLabel} from "./textLabel";
import {Toolbox} from "../toolbox/toolbox";
import {DiaSounds} from "../util/diaSounds";
import {IPersistenceManager} from "../integration/iPersistenceManager";
import {fromDiagramEntity} from "./functions/fromDiagramEntity";


export function diagramEventHandler(event: DiagramEvent,
                                    scene: Scene,
                                    toolbox: Toolbox,
                                    physicsEnabled: boolean,
                                    actionManager: ActionManager,
                                    sounds: DiaSounds,
                                    persistenceManager: IPersistenceManager) {
    const entity = event.entity;
    let mesh;
    if (entity) {
        mesh = scene.getMeshById(entity.id);
    }
    if (!mesh && event?.entity?.template) {
        const toolMesh = scene.getMeshById("tool-" + event.entity.template + "-" + event.entity.color);
        if (!toolMesh && event.type != DiagramEventType.CHANGECOLOR) {
            log.debug('no mesh found for ' + event.entity.template + "-" + event.entity.color, 'adding it');
            toolbox.updateToolbox(event.entity.color);
        }
        mesh = fromDiagramEntity(event.entity, scene);
        if (mesh) {
            mesh.actionManager = actionManager;
            if (physicsEnabled) {
                applyPhysics(sounds, mesh, scene, PhysicsMotionType.DYNAMIC);
            }
        }
    }
    switch (event.type) {
        case DiagramEventType.CLEAR:
            break;
        case DiagramEventType.DROPPED:
            break;
        case DiagramEventType.DROP:
            if (mesh.metadata.template.indexOf('#') > -1) {
                persistenceManager.modify(mesh);
                TextLabel.updateTextNode(mesh, entity.text);
            }

            break;
        case DiagramEventType.ADD:
            persistenceManager.add(mesh);
            if (!mesh.actionManager) {
                mesh.actionManager = actionManager;
            }
            if (physicsEnabled) {
                applyPhysics(sounds, mesh, scene);
            }

            break;
        case DiagramEventType.MODIFY:
            persistenceManager.modify(mesh);
            if (physicsEnabled) {
                applyPhysics(sounds, mesh, scene);
            }

            break;
        case DiagramEventType.CHANGECOLOR:
            if (!event.oldColor) {
                if (!event.newColor) {
                    persistenceManager.changeColor(null, Color3.FromHexString(event.entity.color));
                    this.logger.info("Received color change event, sending entity color as new color");
                } else {
                    this.logger.info("Received color change event, no old color, sending new color");
                    persistenceManager.changeColor(null, event.newColor);
                }
            } else {
                if (event.newColor) {
                    this.logger.info("changing color from " + event.oldColor + " to " + event.newColor);
                    persistenceManager.changeColor(event.oldColor, event.newColor);
                } else {
                    this.logger.error("changing color from " + event.oldColor + ", but no new color found");
                }
            }

            break;
        case DiagramEventType.REMOVE:
            if (mesh) {
                persistenceManager.remove(mesh)
                mesh?.physicsBody?.dispose();
                mesh.dispose();
                sounds.exit.play();
            }
            break;
    }
}

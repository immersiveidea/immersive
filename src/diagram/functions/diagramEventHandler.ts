import {DiagramEvent, DiagramEventType} from "../types/diagramEntity";
import log from "loglevel";
import {applyPhysics} from "./diagramShapePhysics";
import {ActionManager, PhysicsMotionType, Scene} from "@babylonjs/core";
import {updateTextNode} from "../../util/functions/updateTextNode";
import {Toolbox} from "../../toolbox/toolbox";
import {DiaSounds} from "../../util/diaSounds";

import {buildMeshFromDiagramEntity} from "./buildMeshFromDiagramEntity";
import {isDiagramEntity} from "./isDiagramEntity";


export function diagramEventHandler(event: DiagramEvent,
                                    scene: Scene,
                                    toolbox: Toolbox,
                                    physicsEnabled: boolean,
                                    actionManager: ActionManager,
                                    sounds: DiaSounds) {
    const entity = event.entity;
    let mesh;
    if (event.type == DiagramEventType.REMOVE) {
        mesh = scene.getMeshById(entity.id);
    } else {
        if (event?.entity?.template) {
            const toolMesh = scene.getMeshById("tool-" + event.entity.template + "-" + event.entity.color);
            if (!toolMesh && event.type != DiagramEventType.CHANGECOLOR) {
                log.debug('no mesh found for ' + event.entity.template + "-" + event.entity.color, 'adding it');
                toolbox.updateToolbox(event.entity.color);
            }
            mesh = buildMeshFromDiagramEntity(event.entity, scene);
            if (mesh) {
                mesh.actionManager = actionManager;
                if (physicsEnabled) {
                    applyPhysics(sounds, mesh, scene, PhysicsMotionType.DYNAMIC);
                }
            }
        }
    }

    switch (event.type) {
        case DiagramEventType.RESET:
            scene.getNodes().forEach((node) => {
                if (node?.metadata?.template && !node?.metadata?.tool) {
                    node.dispose();
                }
            });
            break;
        case DiagramEventType.CLEAR:
            break;
        case DiagramEventType.DROPPED:
            break;
        case DiagramEventType.DROP:
            if (isDiagramEntity(mesh) && (mesh.metadata.template.indexOf('#') > -1)) {
                updateTextNode(mesh, entity.text);
            }
            break;
        case DiagramEventType.ADD:
            if (!mesh.actionManager) {
                mesh.actionManager = actionManager;
            }
            if (physicsEnabled) {
                applyPhysics(sounds, mesh, scene);
            }
            break;
        case DiagramEventType.MODIFY:
            if (physicsEnabled) {
                applyPhysics(sounds, mesh, scene);
            }
            break;
        case DiagramEventType.REMOVE:
            if (mesh) {
                mesh?.physicsBody?.dispose();
                if (mesh?.metadata?.template == '#connection-template') {
                    if (mesh.parent) {
                        mesh.parent.dispose();
                    } else {
                        mesh.dispose();
                    }
                } else {
                    mesh.dispose();
                }
                sounds.exit.play();
            }
            break;
    }
}

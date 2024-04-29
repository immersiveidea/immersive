import log from "loglevel";
import {AbstractMesh, MeshBuilder, StandardMaterial, Texture} from "@babylonjs/core";
import {DefaultScene} from "../../defaultScene";
import {DiagramEntity} from "../types/diagramEntity";

export function buildImage(entity: DiagramEntity): AbstractMesh {
    const logger = log.getLogger('buildImage');
    logger.debug("buildImage: entity is image");
    const scene = DefaultScene.Scene;
    const plane = MeshBuilder.CreatePlane("plane", {size: 1}, scene);
    const material = new StandardMaterial("planeMaterial", scene);
    const texture = new Texture(entity.image, scene);
    material.emissiveTexture = texture;
    return plane;
}
import log from "loglevel";
import {Color3, Scene, Vector3} from "@babylonjs/core";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramEventType} from "../diagram/types/diagramEntity";

type DrawIOEntity = {
    text?: string,
    id?: string,
    parent?: string,
    parentEntity?: DrawIOEntity,
    geometry?: DrawIOGeometry,

}
type DrawIOGeometry = {
    zIndex?: number,
    x: number,
    y: number,
    width: number,
    height: number

}

class EntityTree {
    private readonly logger = log.getLogger('EntityTree');
    private root: DrawIOEntity;
    private readonly nodes: Map<string, DrawIOEntity> = new Map<string, DrawIOEntity>();
    private readonly unparented: Array<DrawIOEntity> = new Array<DrawIOEntity>();

    constructor() {
        this.root = {};
    }

    public getNodes(): Array<DrawIOEntity> {
        this.reparent();
        const output: Array<DrawIOEntity> = new Array<DrawIOEntity>();
        this.nodes.forEach((node) => {
            if (node.parentEntity) {
                node.geometry = this.computeOffset(node);
            }
            output.push(node);
        });
        return output;
    }

    public reparent() {
        this.unparented.forEach((node) => {
            if (this.nodes.has(node.parent)) {
                this.logger.debug('reparenting node: ' + node.id + ' to parent: ' + node.parent);
                node.parentEntity = this.nodes.get(node.parent);
            } else {
                this.logger.warn('parent node does not exist for id: ' + node.id +
                    ' parent id: ' + node.parent);
            }
        });
    }

    public addNode(node: DrawIOEntity) {
        if (this.nodes.has(node.id)) {
            this.logger.warn('node already exists for id: ' + node.id);
        } else {
            if (node.parent) {
                if (this.nodes.has(node.parent)) {
                    node.parentEntity = this.nodes.get(node.parent);
                    this.nodes.set(node.id, node);
                } else {
                    this.logger.warn('parent node does not exist for id: ' + node.id +
                        ' parent id: ' + node.parent);
                    this.unparented.push(node);
                }
            } else {
                this.logger.warn('no parent for node id: ' + node.id + 'setting as root');
                this.nodes.set(node.id, node);
                this.root = node;
            }
        }
    }

    private computeOffset(node: DrawIOEntity): DrawIOGeometry {
        if (node.parentEntity) {
            const parentgeo = this.computeOffset(node.parentEntity);
            if (parentgeo) {
                const parentzIndex = 1 + parentgeo.zIndex ? parentgeo.zIndex : 0;
                return {
                    x: node.geometry.x,
                    y: node.geometry.y,
                    width: node.geometry.width,
                    height: node.geometry.height,
                    zIndex: node.geometry.zIndex ? node.geometry.zIndex + parentzIndex : parentzIndex + 1
                };
            } else {
                return {
                    x: node.geometry.x,
                    y: node.geometry.y,
                    width: node.geometry.width,
                    height: node.geometry.height,
                    zIndex: node.geometry.zIndex ? node.geometry.zIndex : 0
                };
            }

        } else {
            if (node.geometry) {
                if (node.geometry.zIndex === undefined) {
                    node.geometry.zIndex = 0;
                }
                return node.geometry;
            } else {
                return {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    zIndex: 0
                }
            }

        }
    }
}

type DrawIOConnector = {
    id: string,
    source: string,
    target: string,
    text: string
}

export class DrawioManager {
    private diagramManager: DiagramManager;
    private connectors: Array<DrawIOConnector> = [];
    private readonly scene: Scene;
    private readonly logger = log.getLogger('DrawioManager');
    private minY = 0;
    private minX = 0;
    private maxX = 0;
    private maxY = 0;
    private maxZ = 0;

    constructor(scene: Scene, diagramManager: DiagramManager) {
        this.scene = scene;
        this.diagramManager = diagramManager;
        this.buildGraph();
    }


    private async fetchData(url: string): Promise<Document> {
        this.logger.debug("starting to get graph");
        const graph = await fetch(url);
        this.logger.debug('got graph');
        const graphXml = await graph.text();
        return new DOMParser().parseFromString(graphXml, 'text/html');
    }

    private getDiagram(doc: Document, index: number): Element {
        const firstDiagram = doc.querySelectorAll('diagram')[index];
        return firstDiagram.querySelector('mxGraphModel');
    }

    private parseDiagram(mxDiagram: Element): EntityTree {
        const entityTree = new EntityTree();

        mxDiagram.querySelectorAll('mxCell').forEach((cell) => {
            const value = cell.getAttribute('value');
            let ent = null;
            if (value) {
                ent = new DOMParser().parseFromString(value, 'text/html');
                const errorNode = ent.querySelector("parsererror");
                if (errorNode) {
                    this.logger.error(value);
                }

            }

            const text = ent ? this.getText(ent, '') : '';
            const id = cell.getAttribute('id');
            const parent = cell.getAttribute('parent');
            const source = cell.getAttribute('source');
            const target = cell.getAttribute('target');
            const edge = cell.getAttribute('target');
            if (source && target && edge) {
                this.connectors.push({id: id, source: source, target: target, text: text});
            } else {

                const geo = cell.querySelector('[id="' + id + '"] > mxGeometry');
                let geometry;
                if (geo) {
                    geometry = {
                        x: Number.parseFloat(geo.getAttribute('x')),
                        y: Number.parseFloat(geo.getAttribute('y')),
                        width: Number.parseFloat(geo.getAttribute('width')),
                        height: Number.parseFloat(geo.getAttribute('height')),
                    }
                } else {
                    geometry = {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0
                    }
                }


                //entities.push({text: text, id: id, parent: parent, geometry: this.fixMinMax(geometry)});
                if (text) {
                    this.logger.debug('Text' + text);
                    this.logger.debug('Geometry' + JSON.stringify(geometry));
                }
                if (geometry) {
                    if (Number.isNaN(geometry.x) || Number.isNaN(geometry.y)
                        || Number.isNaN(geometry.width) ||
                        Number.isNaN(geometry.height)) {
                        this.logger.warn('invalid geometry for node: ' + id, geometry);
                    } else {
                        entityTree.addNode({text: text, id: id, parent: parent, geometry: geometry});

                    }
                }
            }
        });
        return entityTree
    }

    private async buildGraph() {

        const doc = await this.fetchData('/arch_demo.xml');
        const mxDiagram = this.getDiagram(doc, 0);
        this.logger.debug('begin parse');
        const entities: EntityTree = this.parseDiagram(mxDiagram);

        entities.getNodes().forEach((node) => {
            if (node.geometry.x < this.minX) {
                this.minX = node.geometry.x;
                this.logger.debug('minX: ' + this.minX);
            }
            if (node.geometry.y < this.minY) {
                this.minY = node.geometry.y;
                this.logger.debug('minY: ' + this.minY);
            }
            if (node.geometry.x + node.geometry.width > this.maxX) {
                this.maxX = node.geometry.x + node.geometry.width;
                this.logger.debug('maxX: ' + this.maxX);
            }
            if (node.geometry.y + node.geometry.height > this.maxY) {
                this.maxY = node.geometry.y + node.geometry.height;
                this.logger.debug('maxY: ' + this.maxY);
            }
            if (node.geometry.zIndex > this.maxZ) {
                this.maxZ = node.geometry.zIndex;
                this.logger.debug('maxZ: ' + this.maxZ);
            }

        });
        this.logger.info('minX: ' + this.minX + ' minY: ' + this.minY + ' maxX: ' + this.maxX + ' maxY: ' + this.maxY);


        this.logger.debug('done parsing');
        this.logger.debug(this.connectors);
        this.createSceneData(entities.getNodes());

    }

    private createSceneData(nodes) {
        const yOffset = 20;
        const scale = .001;
        nodes.forEach((entity) => {
            this.diagramManager.onDiagramEventObservable.notifyObservers(
                {
                    type: DiagramEventType.ADD,
                    entity: {
                        text: entity.text,
                        id: entity.id,
                        position: new Vector3(
                            (entity.geometry.x * scale) - (entity.geometry.width * scale / 2),
                            yOffset - (entity.geometry.y * scale) + (entity.geometry.height * scale / 2),
                            entity.geometry.zIndex * .1),
                        scale: new Vector3(entity.geometry.width * scale, entity.geometry.height * scale, .05),
                        color: Color3.Blue().toHexString(),
                        template: '#box-template'
                    }
                }
            );
        });


    }

    private getText(obj: Node, text: string): string {
        if (obj.nodeType == Node.TEXT_NODE) {
            if (obj.textContent) {
                return obj.textContent.trim();
            } else {
                return '';
            }
        } else {
            if (obj.childNodes) {
                let t = '';
                obj.childNodes.forEach((child) => {
                    t += ' ' + this.getText(child, '');
                });
                return text.trim() + ' ' + t.trim();
            } else {
                return '';
            }
        }
    }
}

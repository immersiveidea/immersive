import log from "loglevel";
import {Color3, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {DiagramManager} from "../diagram/diagramManager";
import {DiagramEventType} from "../diagram/diagramEntity";

export class DrawioManager {
    private diagramManager: DiagramManager;
    private readonly zdepth: Map<string, number> = new Map<string, number>();
    private readonly scene: Scene;
    private readonly logger = log.getLogger('DrawioManager');
    private minY = 0;
    private minX = 0;
    private maxX = 0;
    private maxY = 0;

    constructor(scene: Scene, diagramManager: DiagramManager) {
        this.scene = scene;
        this.diagramManager = diagramManager;
        this.getGraph();
    }



    private async getGraph() {
        this.logger.debug("starting to get graph");
        const entities: Array<{ text: string, id: string, geometry: { x: number, y: number, width: number, height: number } }>
            = new Array<{ text: string; id: string, geometry: { x: number; y: number; width: number; height: number } }>();

        const graph = await fetch('/arch_demo.xml');
        this.logger.debug('got graph');
        const graphXml = await graph.text();
        const doc = new DOMParser().parseFromString(graphXml, 'text/html');
        //this.logger.debug(doc);
        const firstDiagram = doc.querySelectorAll('diagram')[0];
        const mxDiagram = firstDiagram.querySelector('mxGraphModel');
        const width = mxDiagram.getAttribute('pageWidth');
        const height = mxDiagram.getAttribute('pageHeight');
        this.logger.debug('begin parse');
        mxDiagram.querySelectorAll('mxCell').forEach((cell) => {

            const value = cell.getAttribute('value');
            if (!value) {
                //this.logger.warn('no value for :' , cell);
            } else {
                const ent = new DOMParser().parseFromString(value, 'text/html');
                const errorNode = ent.querySelector("parsererror");
                this.logger.debug(value);
                if (errorNode) {
                    //this.logger.debug(value);
                } else {
                    const text = this.getText(ent, '');
                    const id = cell.getAttribute('id');
                    const parent = cell.getAttribute('parent');
                    if (this.zdepth.has(parent)) {
                        this.zdepth.set(id, this.zdepth.get(parent) + .2);
                    } else {
                        this.zdepth.set(cell.getAttribute('id'), 0);
                    }
                    const geo = cell.querySelector('mxGeometry');
                    const geometry = {
                        x: geo.getAttribute('x'),
                        y: geo.getAttribute('y'),
                        width: geo.getAttribute('width'),
                        height: geo.getAttribute('height'),
                    }
                    entities.push({text: text, id: id, geometry: this.fixMinMax(geometry)});
                    if (text) {
                        this.logger.debug('Text' + text);
                        this.logger.debug('Geometry' + JSON.stringify(geometry));
                    }
                }
            }
        });
        this.logger.debug('done parsing');

        this.logger.debug('MinX' + this.minX);
        this.logger.debug('MinY' + this.minY);
        this.logger.debug('MaxX' + this.maxX);
        this.logger.debug('MaxY' + this.maxY);
        const diagramWidth = this.maxX - this.minX;
        const diagramHeight = this.maxY - this.minY;
        let scale = 1;
        if (diagramHeight > diagramWidth) {
            scale = 20 / diagramHeight;
        } else {
            scale = 20 / diagramWidth;
        }
        const anchor = new TransformNode('anchor', this.scene);

        if (entities.length > 0) {
            entities.forEach((entity) => {
                this.diagramManager.onDiagramEventObservable.notifyObservers(
                    {
                        type: DiagramEventType.ADD,
                        entity: {
                            text: entity.text,
                            id: entity.id,
                            position: new Vector3((entity.geometry.x - this.minX) * scale + (entity.geometry.width * scale / 2),
                                (entity.geometry.y - this.minY) * scale + (entity.geometry.height * scale / 2),
                                2 + this.zdepth.get(entity.id)),
                            scale: new Vector3(entity.geometry.width * scale, entity.geometry.height * scale, .1),
                            color: Color3.Blue().toHexString(),
                            template: '#box-template'
                        }
                    }
                );

                //box.metadata = {text: entity.text};
                //box.setParent(anchor);
                //DrawioManager.updateTextNode(box, entity.text);
            });
            anchor.position.y = 20;
            anchor.rotation.x = Math.PI;

        }

        this.logger.debug('Scale' + scale);


    }

    private fixMinMax(geometry: { x: string; y: string; width: string; height: string; }):
        { x: number, y: number, width: number, height: number } {
        let x = 0;
        if (geometry.x) {
            x = parseFloat(geometry.x);
            if (x < this.minX) {
                this.minX = x;
            }
            if (x > this.maxX) {
                this.maxX = x;
            }
        }
        let y = 0;
        if (geometry.y) {
            y = parseFloat(geometry.y);
            if (y < this.minY) {
                this.minY = y;
            }
            if (y > this.maxY) {
                this.maxY = y;
            }
        }
        return ({x: x, y: y, width: parseFloat(geometry.width), height: parseFloat(geometry.height)});
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

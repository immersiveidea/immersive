import {afterEach, describe, expect, it, vi} from 'vitest'
import {buildMeshFromDiagramEntity} from './buildMeshFromDiagramEntity'
import {DiagramEntityType} from "../types/diagramEntity";
import {Vector3} from "@babylonjs/core";

describe('buildMeshFromDiagramEntity', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    })
    it('should return null if entity is null', () => {

        const scene = {
            getMeshById: () => null
        }
        const entity = buildMeshFromDiagramEntity(null, scene as any);
        expect(entity).toBe(null);
    });
    it('should return existing mesh if id exists in scene', () => {
        const material = 'material';
        const scene = {
            getMeshById: (id) => {
                return {
                    id: id,
                    material: material
                }
            }
        }
        const dEntity = {
            type: DiagramEntityType.USER,
        }
        const entity = buildMeshFromDiagramEntity(dEntity, scene as any);
        expect(entity.material).toBe(material);
    });
    it('should generate new mesh if id is missing', () => {

        vi.mock('../diagramConnection', () => {
            const DiagramConnection = vi.fn();
            DiagramConnection.prototype.mesh =
                {
                    id: 'id',
                    material: 'material',
                    getChildren: vi.fn(),
                    getScene: vi.fn()
                }
            return {DiagramConnection}
        });
        const scene = {
            getMeshById: () => {
                return null;
            },
        }
        const dEntity = {
            type: DiagramEntityType.USER,
            template: "#connection-template",
            color: "$FF00FF",
            position: {x: 1, y: 2, z: 3},
            rotation: {x: 4, y: 5, z: 6},
            scale: {x: 7, y: 8, z: 9},
            text: 'new text'

        }
        const entity = buildMeshFromDiagramEntity(dEntity, scene as any);

        expect(entity.id).toBe('id');
        expect(entity.material).toBe('material');
        expect(entity.position).toEqual(new Vector3(1, 2, 3));
        expect(entity.rotation).toEqual(new Vector3(4, 5, 6));
        expect(entity.scaling).toEqual(new Vector3(7, 8, 9));
        expect(entity.metadata.text).toEqual('new text');
    });


});
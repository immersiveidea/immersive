import {afterEach, describe, expect, it, vi} from 'vitest'
import {applyScaling} from './applyScaling'
import {Vector3} from "@babylonjs/core";

describe('applyScaling', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    })
    it('should copy scaling', () => {
        const oldMesh = {
            scaling: {
                clone: () => 'cloned'
            }
        }
        const newMesh = {
            scaling: null
        }
        applyScaling(oldMesh as any, newMesh as any, true, 0)
        expect(newMesh.scaling).toBe('cloned')
    })
    it('scaling to be set to 1,1,1 if snap passed as null', () => {
        const spy = vi.spyOn(Vector3, 'One');
        //expect(spy).toHaveBeenCalledTimes(1);
        const oldMesh = {
            scaling: {}
        }
        const newMesh = {
            scaling: null
        }
        applyScaling(oldMesh as any, newMesh as any, false, null)
        expect(newMesh.scaling.x).toBe(1);
        expect(newMesh.scaling.y).toBe(1);
        expect(newMesh.scaling.z).toBe(1);
    })
    it('scaling to be set to 2,2,2 snap passed as Vector3(2,2,2)', () => {
        const oldMesh = {
            scaling: {}
        }
        const newMesh = {
            scaling: new Vector3()
        }
        applyScaling(oldMesh as any, newMesh as any, false, 2)
        expect(newMesh.scaling.x).toBe(2);
        expect(newMesh.scaling.y).toBe(2);
        expect(newMesh.scaling.z).toBe(2);
    })
});
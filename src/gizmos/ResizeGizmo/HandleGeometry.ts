/**
 * WebXR Resize Gizmo - Handle Geometry Calculations
 * Calculates positions for corner, edge, and face handles based on bounding box
 */

import { Vector3, BoundingBox } from "@babylonjs/core";
import { HandlePosition, HandleType } from "./types";

/**
 * Helper class for calculating handle positions from a bounding box
 */
export class HandleGeometry {
    /**
     * Generate all corner handle positions (8 handles)
     * Corners are at all combinations of min/max X, Y, Z
     */
    static generateCornerHandles(boundingBox: BoundingBox, padding: number = 0): HandlePosition[] {
        const min = boundingBox.minimumWorld;
        const max = boundingBox.maximumWorld;
        const center = boundingBox.centerWorld;

        // Apply padding
        const paddedMin = min.subtract(new Vector3(padding, padding, padding));
        const paddedMax = max.add(new Vector3(padding, padding, padding));

        const corners: HandlePosition[] = [];
        const positions = [
            { x: paddedMax.x, y: paddedMax.y, z: paddedMax.z, id: "corner-xyz" },
            { x: paddedMin.x, y: paddedMax.y, z: paddedMax.z, id: "corner-Xyz" },
            { x: paddedMax.x, y: paddedMin.y, z: paddedMax.z, id: "corner-xYz" },
            { x: paddedMin.x, y: paddedMin.y, z: paddedMax.z, id: "corner-XYz" },
            { x: paddedMax.x, y: paddedMax.y, z: paddedMin.z, id: "corner-xyZ" },
            { x: paddedMin.x, y: paddedMax.y, z: paddedMin.z, id: "corner-XyZ" },
            { x: paddedMax.x, y: paddedMin.y, z: paddedMin.z, id: "corner-xYZ" },
            { x: paddedMin.x, y: paddedMin.y, z: paddedMin.z, id: "corner-XYZ" }
        ];

        for (const pos of positions) {
            const position = new Vector3(pos.x, pos.y, pos.z);
            const normal = position.subtract(center).normalize();

            corners.push({
                position,
                type: HandleType.CORNER,
                axes: ["X", "Y", "Z"],
                normal,
                id: pos.id
            });
        }

        return corners;
    }

    /**
     * Generate all edge handle positions (12 handles)
     * Edges are at midpoints of the 12 edges of the bounding box
     */
    static generateEdgeHandles(boundingBox: BoundingBox, padding: number = 0): HandlePosition[] {
        const min = boundingBox.minimumWorld;
        const max = boundingBox.maximumWorld;
        const center = boundingBox.centerWorld;

        // Apply padding
        const paddedMin = min.subtract(new Vector3(padding, padding, padding));
        const paddedMax = max.add(new Vector3(padding, padding, padding));

        // Calculate midpoints
        const midX = (paddedMin.x + paddedMax.x) / 2;
        const midY = (paddedMin.y + paddedMax.y) / 2;
        const midZ = (paddedMin.z + paddedMax.z) / 2;

        const edges: HandlePosition[] = [];

        // 4 edges parallel to X axis (varying Y and Z)
        edges.push(
            {
                position: new Vector3(midX, paddedMax.y, paddedMax.z),
                type: HandleType.EDGE,
                axes: ["Y", "Z"],
                normal: new Vector3(0, 1, 1).normalize(),
                id: "edge-x-yz"
            },
            {
                position: new Vector3(midX, paddedMin.y, paddedMax.z),
                type: HandleType.EDGE,
                axes: ["Y", "Z"],
                normal: new Vector3(0, -1, 1).normalize(),
                id: "edge-x-Yz"
            },
            {
                position: new Vector3(midX, paddedMax.y, paddedMin.z),
                type: HandleType.EDGE,
                axes: ["Y", "Z"],
                normal: new Vector3(0, 1, -1).normalize(),
                id: "edge-x-yZ"
            },
            {
                position: new Vector3(midX, paddedMin.y, paddedMin.z),
                type: HandleType.EDGE,
                axes: ["Y", "Z"],
                normal: new Vector3(0, -1, -1).normalize(),
                id: "edge-x-YZ"
            }
        );

        // 4 edges parallel to Y axis (varying X and Z)
        edges.push(
            {
                position: new Vector3(paddedMax.x, midY, paddedMax.z),
                type: HandleType.EDGE,
                axes: ["X", "Z"],
                normal: new Vector3(1, 0, 1).normalize(),
                id: "edge-y-xz"
            },
            {
                position: new Vector3(paddedMin.x, midY, paddedMax.z),
                type: HandleType.EDGE,
                axes: ["X", "Z"],
                normal: new Vector3(-1, 0, 1).normalize(),
                id: "edge-y-Xz"
            },
            {
                position: new Vector3(paddedMax.x, midY, paddedMin.z),
                type: HandleType.EDGE,
                axes: ["X", "Z"],
                normal: new Vector3(1, 0, -1).normalize(),
                id: "edge-y-xZ"
            },
            {
                position: new Vector3(paddedMin.x, midY, paddedMin.z),
                type: HandleType.EDGE,
                axes: ["X", "Z"],
                normal: new Vector3(-1, 0, -1).normalize(),
                id: "edge-y-XZ"
            }
        );

        // 4 edges parallel to Z axis (varying X and Y)
        edges.push(
            {
                position: new Vector3(paddedMax.x, paddedMax.y, midZ),
                type: HandleType.EDGE,
                axes: ["X", "Y"],
                normal: new Vector3(1, 1, 0).normalize(),
                id: "edge-z-xy"
            },
            {
                position: new Vector3(paddedMin.x, paddedMax.y, midZ),
                type: HandleType.EDGE,
                axes: ["X", "Y"],
                normal: new Vector3(-1, 1, 0).normalize(),
                id: "edge-z-Xy"
            },
            {
                position: new Vector3(paddedMax.x, paddedMin.y, midZ),
                type: HandleType.EDGE,
                axes: ["X", "Y"],
                normal: new Vector3(1, -1, 0).normalize(),
                id: "edge-z-xY"
            },
            {
                position: new Vector3(paddedMin.x, paddedMin.y, midZ),
                type: HandleType.EDGE,
                axes: ["X", "Y"],
                normal: new Vector3(-1, -1, 0).normalize(),
                id: "edge-z-XY"
            }
        );

        return edges;
    }

    /**
     * Generate all face handle positions (6 handles)
     * Faces are at centers of each face of the bounding box
     */
    static generateFaceHandles(boundingBox: BoundingBox, padding: number = 0): HandlePosition[] {
        const min = boundingBox.minimumWorld;
        const max = boundingBox.maximumWorld;

        // Apply padding
        const paddedMin = min.subtract(new Vector3(padding, padding, padding));
        const paddedMax = max.add(new Vector3(padding, padding, padding));

        // Calculate midpoints
        const midX = (paddedMin.x + paddedMax.x) / 2;
        const midY = (paddedMin.y + paddedMax.y) / 2;
        const midZ = (paddedMin.z + paddedMax.z) / 2;

        const faces: HandlePosition[] = [];

        // +X face (right)
        faces.push({
            position: new Vector3(paddedMax.x, midY, midZ),
            type: HandleType.FACE,
            axes: ["X"],
            normal: new Vector3(1, 0, 0),
            id: "face-x"
        });

        // -X face (left)
        faces.push({
            position: new Vector3(paddedMin.x, midY, midZ),
            type: HandleType.FACE,
            axes: ["X"],
            normal: new Vector3(-1, 0, 0),
            id: "face-X"
        });

        // +Y face (top)
        faces.push({
            position: new Vector3(midX, paddedMax.y, midZ),
            type: HandleType.FACE,
            axes: ["Y"],
            normal: new Vector3(0, 1, 0),
            id: "face-y"
        });

        // -Y face (bottom)
        faces.push({
            position: new Vector3(midX, paddedMin.y, midZ),
            type: HandleType.FACE,
            axes: ["Y"],
            normal: new Vector3(0, -1, 0),
            id: "face-Y"
        });

        // +Z face (front)
        faces.push({
            position: new Vector3(midX, midY, paddedMax.z),
            type: HandleType.FACE,
            axes: ["Z"],
            normal: new Vector3(0, 0, 1),
            id: "face-z"
        });

        // -Z face (back)
        faces.push({
            position: new Vector3(midX, midY, paddedMin.z),
            type: HandleType.FACE,
            axes: ["Z"],
            normal: new Vector3(0, 0, -1),
            id: "face-Z"
        });

        return faces;
    }

    /**
     * Generate all handles based on mode flags
     */
    static generateHandles(
        boundingBox: BoundingBox,
        padding: number,
        includeCorners: boolean,
        includeEdges: boolean,
        includeFaces: boolean
    ): HandlePosition[] {
        const handles: HandlePosition[] = [];

        if (includeCorners) {
            handles.push(...this.generateCornerHandles(boundingBox, padding));
        }

        if (includeEdges) {
            handles.push(...this.generateEdgeHandles(boundingBox, padding));
        }

        if (includeFaces) {
            handles.push(...this.generateFaceHandles(boundingBox, padding));
        }

        return handles;
    }

    /**
     * Calculate padding in world units based on bounding box size
     */
    static calculatePadding(boundingBox: BoundingBox, paddingFactor: number): number {
        const size = boundingBox.extendSizeWorld;
        const avgSize = (size.x + size.y + size.z) / 3;
        return avgSize * paddingFactor;
    }
}

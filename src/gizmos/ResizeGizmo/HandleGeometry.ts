/**
 * WebXR Resize Gizmo - Handle Geometry Calculations
 * Calculates positions for corner, edge, and face handles based on bounding box
 */

import { Vector3, BoundingBox, AbstractMesh } from "@babylonjs/core";
import { HandlePosition, HandleType } from "./types";

/**
 * Helper class for calculating handle positions from a bounding box
 */
export class HandleGeometry {
    /**
     * Calculate the 8 corners of the oriented bounding box (OBB) in world space
     */
    static calculateOBBCorners(mesh: AbstractMesh): Vector3[] {
        // Get bounding box in local space
        const boundingInfo = mesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const min = boundingBox.minimum;
        const max = boundingBox.maximum;

        // Define 8 corners in local space
        const localCorners = [
            new Vector3(min.x, min.y, min.z), // 0: left-bottom-back
            new Vector3(max.x, min.y, min.z), // 1: right-bottom-back
            new Vector3(max.x, min.y, max.z), // 2: right-bottom-front
            new Vector3(min.x, min.y, max.z), // 3: left-bottom-front
            new Vector3(min.x, max.y, min.z), // 4: left-top-back
            new Vector3(max.x, max.y, min.z), // 5: right-top-back
            new Vector3(max.x, max.y, max.z), // 6: right-top-front
            new Vector3(min.x, max.y, max.z)  // 7: left-top-front
        ];

        // Transform corners to world space using mesh's world matrix
        const worldMatrix = mesh.computeWorldMatrix(true);
        const worldCorners = localCorners.map(corner =>
            Vector3.TransformCoordinates(corner, worldMatrix)
        );

        return worldCorners;
    }
    /**
     * Generate all corner handle positions (8 handles) on the OBB
     */
    static generateCornerHandles(mesh: AbstractMesh, paddingFactor: number = 0): HandlePosition[] {
        // Get OBB corners in world space
        const obbCorners = this.calculateOBBCorners(mesh);

        // Get mesh center (pivot point)
        const center = mesh.absolutePosition;

        // Calculate padding in world units
        const boundingInfo = mesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const size = boundingBox.extendSize;
        const avgSize = (size.x + size.y + size.z) / 3;
        const paddingDistance = avgSize * paddingFactor;

        const corners: HandlePosition[] = [];
        const cornerIds = [
            "corner-XYZ", // 0: left-bottom-back
            "corner-xYZ", // 1: right-bottom-back
            "corner-xYz", // 2: right-bottom-front
            "corner-XYz", // 3: left-bottom-front
            "corner-XyZ", // 4: left-top-back
            "corner-xyZ", // 5: right-top-back
            "corner-xyz", // 6: right-top-front
            "corner-Xyz"  // 7: left-top-front
        ];

        for (let i = 0; i < 8; i++) {
            const cornerPos = obbCorners[i];

            // Calculate normal from center to corner
            const normal = cornerPos.subtract(center).normalize();

            // Apply padding by moving corner outward along the normal
            const position = cornerPos.add(normal.scale(paddingDistance));

            corners.push({
                position,
                type: HandleType.CORNER,
                axes: ["X", "Y", "Z"],
                normal,
                id: cornerIds[i]
            });
        }

        return corners;
    }

    /**
     * Generate all edge handle positions (12 handles) on the OBB
     * Edges are at midpoints of the 12 edges of the oriented bounding box
     */
    static generateEdgeHandles(mesh: AbstractMesh, paddingFactor: number = 0): HandlePosition[] {
        // Get OBB corners in world space
        const c = this.calculateOBBCorners(mesh);

        // Get mesh center (pivot point)
        const center = mesh.absolutePosition;

        // Calculate padding distance
        const boundingInfo = mesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const size = boundingBox.extendSize;
        const avgSize = (size.x + size.y + size.z) / 3;
        const paddingDistance = avgSize * paddingFactor;

        const edges: HandlePosition[] = [];

        // Define the 12 edges as pairs of corner indices
        // Each edge scales the TWO axes perpendicular to the edge direction
        const edgeDefinitions = [
            // 4 edges parallel to X-axis (scale Y and Z - perpendicular axes)
            { start: 0, end: 1, axes: ["Y", "Z"], id: "edge-x-YZ" },  // left-bottom-back to right-bottom-back (parallel to X)
            { start: 2, end: 3, axes: ["Y", "Z"], id: "edge-x-Yz" },  // right-bottom-front to left-bottom-front (parallel to X)
            { start: 4, end: 5, axes: ["Y", "Z"], id: "edge-x-yZ" },  // left-top-back to right-top-back (parallel to X)
            { start: 6, end: 7, axes: ["Y", "Z"], id: "edge-x-yz" },  // right-top-front to left-top-front (parallel to X)

            // 4 edges parallel to Z-axis (scale X and Y - perpendicular axes)
            { start: 1, end: 2, axes: ["X", "Y"], id: "edge-z-xY" },  // right-bottom-back to right-bottom-front (parallel to Z)
            { start: 3, end: 0, axes: ["X", "Y"], id: "edge-z-XY" },  // left-bottom-front to left-bottom-back (parallel to Z)
            { start: 5, end: 6, axes: ["X", "Y"], id: "edge-z-xy" },  // right-top-back to right-top-front (parallel to Z)
            { start: 7, end: 4, axes: ["X", "Y"], id: "edge-z-Xy" },  // left-top-front to left-top-back (parallel to Z)

            // 4 edges parallel to Y-axis (scale X and Z - perpendicular axes)
            { start: 0, end: 4, axes: ["X", "Z"], id: "edge-y-XZ" },  // left-bottom-back to left-top-back (parallel to Y)
            { start: 1, end: 5, axes: ["X", "Z"], id: "edge-y-xZ" },  // right-bottom-back to right-top-back (parallel to Y)
            { start: 2, end: 6, axes: ["X", "Z"], id: "edge-y-xz" },  // right-bottom-front to right-top-front (parallel to Y)
            { start: 3, end: 7, axes: ["X", "Z"], id: "edge-y-Xz" }   // left-bottom-front to left-top-front (parallel to Y)
        ];

        for (const edge of edgeDefinitions) {
            // Calculate midpoint of edge
            const midpoint = c[edge.start].add(c[edge.end]).scale(0.5);

            // Calculate normal from center to midpoint
            const normal = midpoint.subtract(center).normalize();

            // Apply padding by moving outward along the normal
            const position = midpoint.add(normal.scale(paddingDistance));

            edges.push({
                position,
                type: HandleType.EDGE,
                axes: edge.axes,
                normal,
                id: edge.id
            });
        }

        return edges;
    }

    /**
     * Generate all face handle positions (6 handles) on the OBB
     * Faces are at centers of each face of the oriented bounding box
     */
    static generateFaceHandles(mesh: AbstractMesh, paddingFactor: number = 0): HandlePosition[] {
        // Get OBB corners in world space
        const c = this.calculateOBBCorners(mesh);

        // Get mesh center (pivot point)
        const center = mesh.absolutePosition;

        // Calculate padding distance
        const boundingInfo = mesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const size = boundingBox.extendSize;
        const avgSize = (size.x + size.y + size.z) / 3;
        const paddingDistance = avgSize * paddingFactor;

        const faces: HandlePosition[] = [];

        // Define the 6 faces as sets of 4 corner indices
        const faceDefinitions = [
            { corners: [0, 1, 2, 3], axes: ["Y"], id: "face-Y" },  // Bottom face
            { corners: [4, 5, 6, 7], axes: ["Y"], id: "face-y" },  // Top face
            { corners: [0, 1, 5, 4], axes: ["Z"], id: "face-Z" },  // Back face
            { corners: [2, 3, 7, 6], axes: ["Z"], id: "face-z" },  // Front face
            { corners: [1, 2, 6, 5], axes: ["X"], id: "face-x" },  // Right face
            { corners: [0, 3, 7, 4], axes: ["X"], id: "face-X" }   // Left face
        ];

        for (const face of faceDefinitions) {
            // Calculate center of face (average of 4 corners)
            let faceCenter = Vector3.Zero();
            for (const cornerIdx of face.corners) {
                faceCenter = faceCenter.add(c[cornerIdx]);
            }
            faceCenter = faceCenter.scale(0.25);

            // Calculate normal from center to face center
            const normal = faceCenter.subtract(center).normalize();

            // Apply padding by moving outward along the normal
            const position = faceCenter.add(normal.scale(paddingDistance));

            faces.push({
                position,
                type: HandleType.FACE,
                axes: face.axes,
                normal,
                id: face.id
            });
        }

        return faces;
    }

    /**
     * Generate all handles based on mode flags (OBB-based)
     */
    static generateHandles(
        mesh: AbstractMesh,
        paddingFactor: number,
        includeCorners: boolean,
        includeEdges: boolean,
        includeFaces: boolean
    ): HandlePosition[] {
        const handles: HandlePosition[] = [];

        if (includeCorners) {
            handles.push(...this.generateCornerHandles(mesh, paddingFactor));
        }

        if (includeEdges) {
            handles.push(...this.generateEdgeHandles(mesh, paddingFactor));
        }

        if (includeFaces) {
            handles.push(...this.generateFaceHandles(mesh, paddingFactor));
        }

        return handles;
    }
}

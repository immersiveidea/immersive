# ResizeGizmo TODO and Known Issues

## Recently Completed

### ✅ Remove Edge Handles to Simplify UX (Completed 2025-11-14)
- **Problem:** Edge handles (green, two-axis scaling) added cognitive complexity without unique capabilities
- **User Decision:** Simplify interface by removing edge handles entirely
- **Solution:**
  1. Removed `TWO_AXIS` mode from `ResizeGizmoMode` enum
  2. Updated `usesEdgeHandles()` to always return `false`
  3. Updated mode comments to reflect 14 total handles (6 face + 8 corner)
- **Result:** Simpler, more intuitive interface with only two handle types:
  - **Corner handles (blue):** Uniform scaling on all axes
  - **Face handles (red):** Single-axis scaling
  - All scaling capabilities still available (two-axis can be done sequentially with face handles)
- **Files Modified:**
  - `types.ts`: Removed TWO_AXIS mode
  - `ResizeGizmoConfig.ts`: Disabled edge handles
  - HandleGeometry still contains edge generation code but it's never called

### ✅ Fix OBB-Based Scaling for Rotated Meshes (Completed 2025-11-14)
- **Problem:** Bounding box wireframe and handles were using AABB (axis-aligned), not rotating with mesh
- **User Requirement:** Scaling should follow mesh's rotated local axes with handles on OBB
- **Solution:** Implemented true OBB (oriented bounding box) system:
  1. Created `calculateOBBCorners()` to transform local corners to world space
  2. Updated bounding box visualization to use OBB corners (lines rotate with mesh)
  3. Rewrote all handle generation (corner, edge, face) to position on OBB
  4. Verified ScalingCalculator correctly transforms local axes to world space
- **Result:** Bounding box and handles now rotate with mesh, scaling follows mesh's local coordinate system
- **Files Modified:**
  - `ResizeGizmoVisuals.ts`: OBB wireframe visualization
  - `HandleGeometry.ts`: OBB-based handle positioning
  - `ScalingCalculator.ts`: Already correct (transforms axes to world space)

### ✅ Move Handles Inside Bounding Box (Completed 2025-11-13)
- **Problem:** Handles were positioned outside bounding box, causing selection issues
- **Solution:** Reversed padding direction in `HandleGeometry.ts`
- **Result:** Handles now 5% inside edges instead of 5% outside
- **Commit:** `204ef67`

### ✅ Fix Color Persistence Bug (Completed 2025-11-13)
- **Problem:** Diagram entities losing color when scaled via ResizeGizmo
- **Root Cause:** `DiagramEntityAdapter` was only copying metadata, not extracting color from material
- **Solution:** Use `toDiagramEntity()` converter which properly extracts color from material
- **Commit:** `26b48b2`

### ✅ Extract DiagramEntityAdapter to Integration Layer (Completed 2025-11-13)
- **Problem:** Adapter was in ResizeGizmo folder, causing tight coupling
- **Solution:** Moved to `src/integration/gizmo/` with dependency injection
- **Result:** ResizeGizmo is now pure and reusable
- **Commit:** `26b48b2`

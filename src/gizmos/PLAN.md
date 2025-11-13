# WebXR Resize Gizmo - Implementation Plan & Documentation

## Overview

A self-contained, extractable WebXR resize gizmo system for BabylonJS with advanced features including:

- **4 Configurable Modes**: Single-axis, uniform, two-axis, and all-modes combined
- **WebXR Grip Button Control**: Hover handle → hold grip → drag → release workflow
- **Visual Feedback**: Numeric displays, alignment grids, snap indicators, color-coded handles
- **Snapping System**: Configurable snap points with visual and haptic feedback
- **Bounding Box Visualization**: Automatic highlighting with configurable padding
- **DiagramEntity Integration**: Optional adapter for persistence systems

## Directory Structure

```
src/gizmos/ResizeGizmo/
├── index.ts                        # Main exports
├── types.ts                        # TypeScript type definitions
├── ResizeGizmoManager.ts           # Main orchestration class
├── ResizeGizmoConfig.ts            # Configuration management
├── ResizeGizmoVisuals.ts           # Bounding box & handle rendering
├── ResizeGizmoInteraction.ts       # WebXR input handling
├── ResizeGizmoSnapping.ts          # Snap-to-grid system
├── ResizeGizmoFeedback.ts          # Visual feedback (numeric, grids, indicators)
├── ScalingCalculator.ts            # Scaling math for all handle types
├── HandleGeometry.ts               # Handle position calculations
└── DiagramEntityAdapter.ts         # Optional DiagramManager integration
```

## Feature Checklist

### Core Features
- [x] Four configurable scaling modes (SINGLE_AXIS, UNIFORM, TWO_AXIS, ALL)
- [x] WebXR grip button interaction (hover → hold → drag → release)
- [x] Bounding box visualization with configurable padding
- [x] Handle meshes sized for easy WebXR interaction
- [x] UtilityLayerRenderer integration (no main scene pollution)
- [x] Color-coded handles by type (corner, edge, face)

### Interaction Features
- [x] Hover detection for mesh and handles
- [x] Handle highlighting on hover
- [x] Active state visualization during drag
- [x] Scaling calculations for all handle types
- [x] Min/max scale constraints
- [x] Scale from center option

### Snapping System
- [x] Configurable snap intervals per axis
- [x] Visual snap point indicators
- [x] Snap proximity calculation
- [x] Haptic feedback on snap (WebXR)
- [x] Option to disable snapping

### Visual Feedback
- [x] Numeric display (scale values & percentages)
- [x] Alignment grids (1D, 2D, 3D based on mode)
- [x] Snap point visualization
- [x] Color changes (idle/hover/active states)
- [x] Billboard text display

### Integration
- [x] Event system (Observable-based)
- [x] DiagramEntity adapter for persistence
- [x] Self-contained with no hard dependencies
- [x] Configurable and extensible

## Scaling Modes

### Mode 1: SINGLE_AXIS
**Handles**: 6 face-center handles
**Behavior**: Scale only along single axis (X, Y, or Z)
**Use Case**: Stretching/compressing in one direction

**Handle Positions**:
- Face +X: `(max.x, mid.y, mid.z)`
- Face -X: `(min.x, mid.y, mid.z)`
- Face +Y: `(mid.x, max.y, mid.z)`
- Face -Y: `(mid.x, min.y, mid.z)`
- Face +Z: `(mid.x, mid.y, max.z)`
- Face -Z: `(mid.x, mid.y, min.z)`

### Mode 2: UNIFORM
**Handles**: 8 corner handles
**Behavior**: Scale all axes equally (proportional)
**Use Case**: Resizing while maintaining proportions

**Handle Positions**: All 8 combinations of `(min/max.x, min/max.y, min/max.z)`

### Mode 3: TWO_AXIS
**Handles**: 12 edge-center handles
**Behavior**: Scale two axes simultaneously
**Use Case**: Scaling faces/planes without affecting depth

**Handle Positions**:
- 4 edges parallel to X: `(mid.x, ±Y, ±Z)` → scales Y & Z
- 4 edges parallel to Y: `(±X, mid.y, ±Z)` → scales X & Z
- 4 edges parallel to Z: `(±X, ±Y, mid.z)` → scales X & Y

### Mode 4: ALL
**Handles**: 26 handles (8 corners + 12 edges + 6 faces)
**Behavior**: Handle type determines scaling mode:
- Corner → uniform
- Edge → two-axis
- Face → single-axis

**Use Case**: Maximum flexibility in single gizmo

## API Reference

### ResizeGizmoManager

Main class for managing the gizmo system.

#### Constructor
```typescript
constructor(scene: Scene, config?: Partial<ResizeGizmoConfig>)
```

#### Methods

**Mesh Attachment**
```typescript
attachToMesh(mesh: AbstractMesh): void
detachFromMesh(): void
getAttachedMesh(): AbstractMesh | undefined
```

**Controller Registration**
```typescript
registerController(controller: WebXRInputSource): void
unregisterController(controller: WebXRInputSource): void
```

**Update Loop**
```typescript
update(): void  // Call in scene.onBeforeRenderObservable
```

**Mode Management**
```typescript
setMode(mode: ResizeGizmoMode): void
getMode(): ResizeGizmoMode
```

**Configuration**
```typescript
updateConfig(updates: Partial<ResizeGizmoConfig>): void
getConfig(): Readonly<ResizeGizmoConfig>
```

**Enable/Disable**
```typescript
setEnabled(enabled: boolean): void
isEnabled(): boolean
```

**Event Listeners**
```typescript
on(eventType: ResizeGizmoEventType, callback: ResizeGizmoEventCallback): void
off(eventType: ResizeGizmoEventType, callback: ResizeGizmoEventCallback): void

// Convenience methods
onScaleStart(callback: ResizeGizmoEventCallback): void
onScaleDrag(callback: ResizeGizmoEventCallback): void
onScaleEnd(callback: ResizeGizmoEventCallback): void
onAttached(callback: ResizeGizmoEventCallback): void
onDetached(callback: ResizeGizmoEventCallback): void
onModeChanged(callback: ResizeGizmoEventCallback): void
```

**Disposal**
```typescript
dispose(): void
```

### ResizeGizmoConfig

Configuration interface with the following properties:

#### Mode Configuration
- `mode: ResizeGizmoMode` - Scaling mode (default: `ResizeGizmoMode.ALL`)

#### Handle Appearance
- `handleSize: number` - Size of handle meshes as fraction of bounding box (default: `0.2` = 20% of average dimension)
- `cornerHandleColor: Color3` - Corner handle color (default: blue)
- `edgeHandleColor: Color3` - Edge handle color (default: green)
- `faceHandleColor: Color3` - Face handle color (default: red)
- `hoverColor: Color3` - Hover highlight color (default: yellow)
- `activeColor: Color3` - Active drag color (default: orange)
- `hoverScaleFactor: number` - Scale multiplier on hover (default: `1.3`)

#### Bounding Box
- `boundingBoxPadding: number` - Padding around mesh (default: `0.05` = 5%)
- `boundingBoxColor: Color3` - Wireframe color (default: white)
- `wireframeAlpha: number` - Wireframe transparency 0-1 (default: `0.3`)
- `showBoundingBoxOnHoverOnly: boolean` - Only show on hover (default: `false`)

#### Snapping
- `enableSnapping: boolean` - Enable snap-to-grid (default: `true`)
- `snapDistanceX: number` - X-axis snap interval (default: `0.1`)
- `snapDistanceY: number` - Y-axis snap interval (default: `0.1`)
- `snapDistanceZ: number` - Z-axis snap interval (default: `0.1`)
- `showSnapIndicators: boolean` - Show snap point markers (default: `true`)
- `hapticFeedback: boolean` - WebXR haptic feedback (default: `true`)

#### Visual Feedback
- `showNumericDisplay: boolean` - Show scale values (default: `true`)
- `showGrid: boolean` - Show alignment grid (default: `true`)
- `showSnapPoints: boolean` - Show snap points (default: `true`)
- `numericDisplayFontSize: number` - Font size for text (default: `24`)

#### Constraints
- `minScale: Vector3` - Minimum scale values (default: `(0.01, 0.01, 0.01)`)
- `maxScale?: Vector3` - Maximum scale values (default: `undefined`)
- `lockAspectRatio: boolean` - Lock aspect in TWO_AXIS mode (default: `false`)
- `scaleFromCenter: boolean` - Scale from center or corner (default: `true`)

#### Integration
- `useDiagramEntity: boolean` - Use DiagramEntity integration (default: `false`)
- `diagramManager?: any` - DiagramManager instance
- `emitEvents: boolean` - Emit Observable events (default: `true`)

### Events

#### ResizeGizmoEventType
```typescript
enum ResizeGizmoEventType {
    SCALE_START,    // Grip pressed on handle
    SCALE_DRAG,     // During drag
    SCALE_END,      // Grip released
    ATTACHED,       // Gizmo attached to mesh
    DETACHED,       // Gizmo detached
    MODE_CHANGED    // Mode changed
}
```

#### ResizeGizmoEvent
```typescript
interface ResizeGizmoEvent {
    type: ResizeGizmoEventType;
    mesh: AbstractMesh;
    scale: Vector3;              // Current scale
    previousScale?: Vector3;      // Previous scale (SCALE_END only)
    handle?: HandlePosition;      // Handle being used
    timestamp: number;
}
```

## Usage Examples

### Basic Standalone Usage

```typescript
import { ResizeGizmoManager, ResizeGizmoMode } from './gizmos/ResizeGizmo';

// Create gizmo
const gizmo = new ResizeGizmoManager(scene, {
    mode: ResizeGizmoMode.ALL,
    enableSnapping: true,
    snapDistanceX: 0.1,
    snapDistanceY: 0.1,
    snapDistanceZ: 0.1,
    showNumericDisplay: true,
    showGrid: true
});

// Attach to mesh
gizmo.attachToMesh(myMesh);

// Register WebXR controllers
xr.input.onControllerAddedObservable.add((controller) => {
    gizmo.registerController(controller);
});

xr.input.onControllerRemovedObservable.add((controller) => {
    gizmo.unregisterController(controller);
});

// Update in render loop
scene.onBeforeRenderObservable.add(() => {
    gizmo.update();
});

// Listen to events
gizmo.onScaleEnd((event) => {
    console.log('Scaling finished:', event.scale);
    console.log('Delta:', event.scale.subtract(event.previousScale));
});

// Cleanup
gizmo.dispose();
```

### With DiagramEntity Integration

```typescript
import { createDiagramGizmo, ResizeGizmoMode } from './gizmos/ResizeGizmo';

// Create gizmo with DiagramManager integration
const { gizmo, adapter } = createDiagramGizmo(scene, diagramManager, {
    mode: ResizeGizmoMode.UNIFORM,
    enableSnapping: true
});

// Attach to DiagramEntity mesh
gizmo.attachToMesh(diagramEntityMesh);

// Scale changes automatically persist to database via adapter
```

### Mode Switching

```typescript
const gizmo = new ResizeGizmoManager(scene);

// Start with uniform scaling only
gizmo.setMode(ResizeGizmoMode.UNIFORM);

// Switch to single-axis mode
gizmo.setMode(ResizeGizmoMode.SINGLE_AXIS);

// Enable all modes
gizmo.setMode(ResizeGizmoMode.ALL);

// Listen to mode changes
gizmo.onModeChanged((event) => {
    console.log('Mode changed to:', gizmo.getMode());
});
```

### Custom Configuration

```typescript
const gizmo = new ResizeGizmoManager(scene, {
    mode: ResizeGizmoMode.ALL,

    // Custom handle colors
    cornerHandleColor: new Color3(1, 0, 0),    // Red corners
    edgeHandleColor: new Color3(0, 1, 0),      // Green edges
    faceHandleColor: new Color3(0, 0, 1),      // Blue faces

    // Larger handles for easier interaction
    handleSize: 0.2,

    // Fine-grained snapping
    snapDistanceX: 0.05,
    snapDistanceY: 0.05,
    snapDistanceZ: 0.05,

    // Scale constraints
    minScale: new Vector3(0.1, 0.1, 0.1),
    maxScale: new Vector3(10, 10, 10),

    // Disable some visual feedback
    showGrid: false,
    showSnapPoints: false
});

// Update config at runtime
gizmo.updateConfig({
    snapDistanceX: 0.1,
    showGrid: true
});
```

### Advanced: Custom Event Handling

```typescript
const gizmo = new ResizeGizmoManager(scene);

// Track scaling session
let scalingStarted = false;
let originalScale: Vector3;

gizmo.onScaleStart((event) => {
    scalingStarted = true;
    originalScale = event.scale.clone();
    console.log('Started scaling from:', originalScale);
});

gizmo.onScaleDrag((event) => {
    // Real-time feedback during drag
    const delta = event.scale.subtract(originalScale);
    console.log('Scale delta:', delta);
});

gizmo.onScaleEnd((event) => {
    scalingStarted = false;

    const finalDelta = event.scale.subtract(event.previousScale);
    console.log('Scaling session completed');
    console.log('Total change:', finalDelta);

    // Undo support
    saveToUndoStack({
        action: 'scale',
        mesh: event.mesh,
        before: event.previousScale,
        after: event.scale
    });
});
```

## Integration with Existing Codebase

### Option 1: Use with DiagramManager (Recommended)

```typescript
import { createDiagramGizmo } from './gizmos/ResizeGizmo';
import { diagramManager } from './diagram/diagramManager';
import { DefaultScene } from './defaultScene';

// Create integrated gizmo
const { gizmo, adapter } = createDiagramGizmo(
    DefaultScene.Scene,
    diagramManager,
    {
        mode: ResizeGizmoMode.ALL,
        snapDistanceX: diagramManager._config.current.createSnap,
        snapDistanceY: diagramManager._config.current.createSnap,
        snapDistanceZ: diagramManager._config.current.createSnap
    }
);

// Register with XR controllers (similar to existing pattern)
DefaultScene.Scene.onBeforeRenderObservable.add(() => {
    gizmo.update();
});
```

### Option 2: Standalone in Menu System

```typescript
import { ResizeGizmoManager, ResizeGizmoMode } from './gizmos/ResizeGizmo';

export class NewScaleMenu {
    private gizmo: ResizeGizmoManager;

    constructor(scene: Scene) {
        this.gizmo = new ResizeGizmoManager(scene, {
            mode: ResizeGizmoMode.ALL
        });
    }

    show(mesh: AbstractMesh) {
        this.gizmo.attachToMesh(mesh);
    }

    hide() {
        this.gizmo.detachFromMesh();
    }
}
```

## Extraction Guide

To extract this gizmo to another project:

1. **Copy Directory**: Copy entire `src/gizmos/ResizeGizmo/` folder

2. **Dependencies**: Ensure BabylonJS packages:
   ```json
   {
       "@babylonjs/core": "^8.x.x"
   }
   ```

3. **Import**:
   ```typescript
   import { ResizeGizmoManager } from './path/to/ResizeGizmo';
   ```

4. **Optional Integration**:
   - If using DiagramEntity integration, adapt `DiagramEntityAdapter.ts` to your persistence system
   - If not using, simply don't import the adapter

5. **No Hard Dependencies**: The gizmo has no hard dependencies on the "immersive" codebase

## Performance Considerations

### Optimization Tips

1. **Update Frequency**: Only call `update()` when gizmo is attached and enabled
2. **Handle Count**: Use specific modes (UNIFORM, SINGLE_AXIS, TWO_AXIS) instead of ALL to reduce handle count
3. **Visual Feedback**: Disable expensive features if needed:
   - `showGrid: false`
   - `showSnapPoints: false`
   - `showNumericDisplay: false`
4. **Snap Calculation**: Snapping calculations are lightweight, but haptic feedback checks run every frame during drag
5. **Event Emission**: Set `emitEvents: false` if not using event listeners

### Memory Management

- Always call `dispose()` when done
- Detach from mesh before disposing
- Unregister controllers explicitly if managing lifecycle

## Known Limitations

1. **Rotation**: Handles are positioned in world space; mesh rotation affects scaling behavior
2. **Parenting**: Works best with top-level meshes; parented meshes may have unexpected behavior
3. **Non-Uniform Bounds**: Works with any mesh shape, but handles positioned based on AABB
4. **WebXR Only**: Grip button interaction designed for WebXR; mouse/touch support would require additional implementation
5. **Single Mesh**: One gizmo instance per mesh (no multi-selection scaling currently)

## Future Enhancements

Potential features for future implementation:

- [ ] Mouse/touch interaction support
- [ ] Multi-mesh selection and scaling
- [ ] Rotation-aware local-space handles
- [ ] Custom handle shapes (spheres, cylinders)
- [ ] Animation curves for smooth scaling
- [ ] Undo/redo integration
- [ ] Keyboard modifiers (shift for uniform, ctrl for snap override)
- [ ] Handle-specific constraints (lock certain axes)
- [ ] Percentage-based scaling input
- [ ] Copy scale values between meshes

## Troubleshooting

### Handles not visible
- Check that `setEnabled(true)` is called
- Verify UtilityLayer is rendering
- Ensure handleSize is appropriate for mesh scale

### Scaling not working
- Confirm `update()` is called in render loop
- Check that controllers are registered
- Verify grip button component exists on controller

### Snap not working
- Confirm `enableSnapping: true`
- Check snap distances are > 0
- Verify snapping is not disabled in config

### DiagramEntity not persisting
- Ensure `useDiagramEntity: true` and `diagramManager` is provided
- Check DiagramEntityAdapter is created
- Verify DiagramManager observable is working

## Version History

- **v1.0.0** (Initial Implementation)
  - Four configurable modes
  - WebXR grip button interaction
  - Visual feedback system
  - Snapping with haptic feedback
  - DiagramEntity integration adapter
  - Full documentation

## License

Part of the "immersive" project. See project LICENSE file.

## Support

For issues or questions specific to this gizmo:
1. Check this PLAN.md documentation
2. Review code examples above
3. Examine type definitions in `types.ts`
4. Test with standalone example before integrating

---

**Implementation Status**: ✅ Complete

All planned features have been implemented and documented.

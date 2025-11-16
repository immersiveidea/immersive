# WebXR Resize Gizmo - Implementation Plan & Documentation

## Overview

A simple, self-contained, extractable WebXR resize gizmo system for BabylonJS with the following features:


## Directory Structure

```
src/gizmos/ResizeGizmo/
├── index.ts                        # Main exports
├── types.ts                        # TypeScript type definitions
```

## Feature Checklist

### Core Features
* Create a new Gizmo and pass an AbstractMesh in the contructor known as "gizmo target"
* Gizmo will create handles in utility layer taking into account scale and rotation of "gizmo target"
* Handles should be large enough to easily grab, but not so large that they overlap
* Handles should be outside the bounding box of the "gizmo target"
* Gizmo will say active until dispose()  is called on the gizmo instance.
* When xr controller "ray" in utility scene intersects a handle, the handle will change color and get slightly larger
* When xr controller "grip" button is pressed while a handle is highlighted, the color of the highlighted handle will change and gizmo will enter "scaling mode"
* In "scaling mode", the handle is able to move outward from the center of the "gizmo target" depending on the type of handle selected
* In "scaling mode", the gizmo will scale the "gizmo target" in .1 increments with smallest scale being .1 and no upper bound
* The math to calculate scaling should take into account rotation and original scale of "gizmo target"
* "face handles" will only scale in one axis
* "corner handles" will scale every axis
* the scaling math should take into account the origin of the handle when gripped in the "gizmo target" local space.



### Integration
- [ ] Self-contained with no hard dependencies


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




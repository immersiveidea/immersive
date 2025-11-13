# Naming Conventions

## Tool and Material Naming

This document describes the naming conventions used for tools, materials, and related entities in the immersive WebXR application.

## Material Naming

Materials follow a consistent naming pattern based on their color:

**Format:** `material-{color}`

**Where:**
- `{color}` is the hex string representation of the material's color (e.g., `#ff0000` for red)

**Examples:**
- `material-#ff0000` - Red material
- `material-#00ff00` - Green material
- `material-#222222` - Dark gray material

**Implementation:**
```typescript
const material = new StandardMaterial("material-" + color.toHexString(), scene);
```

**Location:** Materials are created in:
- `src/toolbox/functions/buildColor.ts` - For toolbox color swatches
- `src/diagram/functions/buildMeshFromDiagramEntity.ts` - Fallback material creation via `buildMissingMaterial()`

## Tool Mesh Naming

Tool meshes use a compound naming pattern that includes both the tool type and color:

**Format:** `tool-{toolId}`

**Where:**
- `{toolId}` = `{toolType}-{color}`
- `{toolType}` is a value from the `ToolType` enum (e.g., `BOX`, `SPHERE`, `CYLINDER`, `CONE`, `PLANE`, `PERSON`)
- `{color}` is the hex string representation of the tool's color

**Examples:**
- `tool-BOX-#ff0000` - Red box tool
- `tool-SPHERE-#00ff00` - Green sphere tool
- `tool-CYLINDER-#0000ff` - Blue cylinder tool
- `tool-PLANE-#ffff00` - Yellow plane tool

**Implementation:**
```typescript
function toolId(tool: ToolType, color: Color3) {
    return tool + "-" + color.toHexString();
}

const newItem = await buildMesh(tool, `tool-${id}`, colorParent.getScene());
// For example: `tool-BOX-#ff0000`
```

**Location:** Tool meshes are created in `src/toolbox/functions/buildTool.ts`

## Tool Colors

The application uses 16 predefined colors for the toolbox:

```typescript
const colors: string[] = [
    "#222222", "#8b4513", "#006400", "#778899",  // Row 1: Dark gray, Brown, Dark green, Light slate gray
    "#4b0082", "#ff0000", "#ffa500", "#ffff00",  // Row 2: Indigo, Red, Orange, Yellow
    "#00ff00", "#00ffff", "#0000ff", "#ff00ff",  // Row 3: Green, Cyan, Blue, Magenta
    "#1e90ff", "#98fb98", "#ffe4b5", "#ff69b4"   // Row 4: Dodger blue, Pale green, Moccasin, Hot pink
]
```

## Tool Types

Available tool types from the `ToolType` enum:
- `BOX` - Cube mesh
- `SPHERE` - Sphere mesh
- `CYLINDER` - Cylinder mesh
- `CONE` - Cone mesh
- `PLANE` - Flat plane mesh
- `PERSON` - Person/avatar mesh

## Material Color Access

When accessing material colors, use this priority order to handle both current and legacy materials:

```typescript
// For StandardMaterial
const stdMat = material as StandardMaterial;
const materialColor = stdMat.emissiveColor || stdMat.diffuseColor;

// Current rendering uses emissiveColor
// Legacy materials may have diffuseColor instead
```

## Rendering Modes

Materials can be rendered in three different modes, affecting how color properties are used:

### 1. Lightmap with Lighting
- Uses `diffuseColor` + `lightmapTexture`
- `disableLighting = false`
- Most expensive performance-wise
- Provides lighting illusion with actual lighting calculations

### 2. Unlit with Emissive Texture (Default)
- Uses `emissiveColor` + `emissiveTexture` (lightmap)
- `disableLighting = true`
- Best balance of visual quality and performance
- Provides lighting illusion without lighting calculations

### 3. Flat Emissive
- Uses only `emissiveColor`
- `disableLighting = true`
- Best performance
- No lighting illusion, flat shading

## Instance Naming

Instanced meshes (created from tool templates) follow this pattern:

**Format:** `tool-instance-{toolId}`

**Example:**
```typescript
const instance = new InstancedMesh("tool-instance-" + id, newItem);
// For example: `tool-instance-BOX-#ff0000`
```

These instances share materials with their source mesh and are used for visual feedback before creating actual diagram entities.

## Related Files

- `src/toolbox/functions/buildTool.ts` - Tool mesh creation and naming
- `src/toolbox/functions/buildColor.ts` - Material creation and color management
- `src/diagram/functions/buildMeshFromDiagramEntity.ts` - Diagram entity instantiation
- `src/toolbox/types/toolType.ts` - ToolType enum definition
- `src/util/lightmapGenerator.ts` - Lightmap texture generation and caching
- `src/util/renderingMode.ts` - Rendering mode enum and labels

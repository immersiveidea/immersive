# VR Configuration Panel Implementation Plan

## Overview

Create an immersive WebXR configuration panel that mirrors the 2D ConfigModal functionality using BabylonJS AdvancedDynamicTexture (ADT). The panel will allow users to adjust all application settings directly in VR.

## Recommended Approach: AdvancedDynamicTexture (ADT)

**Why ADT?**
- Most common approach for WebXR UI in BabylonJS
- Existing pattern in codebase (see `src/menus/configMenu.ts`)
- Good balance of simplicity and functionality
- Native support for text, buttons, sliders, and dropdowns
- Easy integration with existing Handle pattern

**Estimated Effort**: 150-200 lines of code, 4-8 hours implementation time

## File Structure

```
src/menus/
├── vrConfigPanel.ts (NEW - main implementation)
└── configMenu.ts (REFERENCE - existing VR config example)

src/diagram/
└── diagramMenuManager.ts (MODIFY - add toolbox button)

src/util/
└── appConfig.ts (USE - singleton for config management)
```

## Implementation Phases

### Phase 1: Core Panel Setup
- [ ] Create `src/menus/vrConfigPanel.ts` file
- [ ] Implement class structure following Handle pattern:
  ```typescript
  export class VRConfigPanel {
      private _scene: Scene;
      private _handleMesh: Mesh;
      private _advancedTexture: AdvancedDynamicTexture;
      private _configObserver: Observer<AppConfigType>;

      constructor(scene: Scene) {
          // Initialize panel
      }

      public get handleMesh(): Mesh {
          return this._handleMesh;
      }

      public show(): void {
          this._handleMesh.setEnabled(true);
      }

      public hide(): void {
          this._handleMesh.setEnabled(false);
      }

      public dispose(): void {
          // Cleanup
      }
  }
  ```
- [ ] Create base mesh (plane) for panel backing
- [ ] Set up AdvancedDynamicTexture with appropriate resolution (1024x1024 or 2048x2048)
- [ ] Position panel at comfortable viewing distance (0.5-0.7m from camera)
- [ ] Make panel grabbable via Handle pattern

**Reference Files**:
- `src/menus/inputTextView.ts` - Handle pattern implementation
- `src/menus/configMenu.ts` - ADT usage example

### Phase 2: UI Layout Structure
- [ ] Create main container (StackPanel for vertical layout)
- [ ] Add title text at top ("Configuration")
- [ ] Create 5 section containers (one for each config group):
  1. Location Snap
  2. Rotation Snap
  3. Fly Mode
  4. Snap Turn
  5. Label Rendering Mode
- [ ] Style containers with padding and spacing
- [ ] Add visual separators between sections

**ADT Components to Use**:
- `StackPanel` - Main vertical container
- `TextBlock` - Labels and section titles
- `Rectangle` - Containers and separators

**Reference**: `src/menus/configMenu.ts:44-89` for existing layout patterns

### Phase 3: Location Snap Section
- [ ] Add "Location Snap" label
- [ ] Create enable/disable toggle button
  - Shows "Enabled" or "Disabled"
  - Updates `appConfigInstance` on click
- [ ] Add RadioGroup for snap values:
  - Options: 1cm (.01), 5cm (.05), 10cm (.1), 50cm (.5), 1m (1)
  - Default: 10cm (.1)
  - Disable when snap is off
- [ ] Wire up to `appConfigInstance.setGridSnap(value)`
- [ ] Subscribe to config changes to update UI

**ADT Components**:
- `Button` - Toggle switch
- `RadioButton` + `TextBlock` - Value selection
- Color coding: enabled (green/myColor), disabled (gray)

**Reference ConfigModal**: `src/react/pages/configModal.tsx:83-94`

### Phase 4: Rotation Snap Section
- [ ] Add "Rotation Snap" label
- [ ] Create enable/disable toggle button
- [ ] Add RadioGroup for rotation values:
  - Options: 22.5°, 45°, 90°, 180°, 360°
  - Default: 90°
  - Disable when snap is off
- [ ] Wire up to `appConfigInstance.setRotateSnap(value)`
- [ ] Subscribe to config changes to update UI

**Reference ConfigModal**: `src/react/pages/configModal.tsx:96-108`

### Phase 5: Fly Mode Section
- [ ] Add "Fly Mode" label
- [ ] Create toggle button
  - Shows "Fly Mode Enabled" or "Fly Mode Disabled"
- [ ] Wire up to `appConfigInstance.setFlyMode(value)`
- [ ] Subscribe to config changes to update UI

**Reference ConfigModal**: `src/react/pages/configModal.tsx:109-112`

### Phase 6: Snap Turn Section
- [ ] Add "Snap Turn" label
- [ ] Create enable/disable toggle button
- [ ] Add RadioGroup for snap turn angles:
  - Options: 22.5°, 45°, 90°, 180°, 360°
  - Default: 45°
  - Disable when snap is off
- [ ] Wire up to `appConfigInstance.setTurnSnap(value)`
- [ ] Subscribe to config changes to update UI

**Reference ConfigModal**: `src/react/pages/configModal.tsx:113-125`

### Phase 7: Label Rendering Mode Section
- [ ] Add "Label Rendering Mode" label
- [ ] Create RadioGroup for rendering modes:
  - Fixed
  - Billboard (Always Face Camera)
  - Dynamic (Coming Soon) - disabled
  - Distance-based (Coming Soon) - disabled
- [ ] Wire up to `appConfigInstance.setLabelRenderingMode(value)`
- [ ] Subscribe to config changes to update UI
- [ ] Style disabled options with gray text

**Reference ConfigModal**: `src/react/pages/configModal.tsx:126-135`

### Phase 8: Integration with Toolbox
- [ ] Modify `src/diagram/diagramMenuManager.ts` to instantiate VRConfigPanel
- [ ] Add "Config" button to toolbox (similar to "Exit VR" button pattern)
- [ ] Wire up button click to show/hide panel
- [ ] Position panel relative to camera when shown (see `positionComponentsRelativeToCamera`)
- [ ] Add parent relationship to platform for movement tracking

**Reference**:
- `src/diagram/diagramMenuManager.ts:85-97` - Exit button creation
- `src/util/functions/groundMeshObserver.ts:127-222` - Component positioning

### Phase 9: Observable Integration
- [ ] Subscribe to `appConfigInstance.onConfigChangedObservable` in constructor
- [ ] Update all UI elements when config changes externally
- [ ] Ensure Observable cleanup in dispose() method
- [ ] Test config changes from both VR panel and 2D ConfigModal

**Pattern**:
```typescript
this._configObserver = appConfigInstance.onConfigChangedObservable.add((config) => {
    // Update UI elements to reflect new config
    this.updateLocationSnapUI(config.locationSnap);
    this.updateRotationSnapUI(config.rotateSnap);
    // ... etc
});
```

### Phase 10: Testing & Polish
- [ ] Test all toggle switches update config correctly
- [ ] Test all radio button selections update config correctly
- [ ] Verify config changes propagate to DiagramObjects (label mode, snap behavior)
- [ ] Test panel positioning in VR (comfortable viewing distance)
- [ ] Test panel grabbability via Handle
- [ ] Verify panel follows platform movement
- [ ] Test config persistence (localStorage)
- [ ] Test config synchronization between VR panel and 2D ConfigModal
- [ ] Add visual feedback for button clicks (color changes, animations)
- [ ] Ensure proper cleanup on panel disposal
- [ ] Test in both WebXR and desktop modes

## Code Patterns to Follow

### 1. Toggle Button Pattern
```typescript
const toggleButton = Button.CreateSimpleButton("toggle", "Enabled");
toggleButton.width = "200px";
toggleButton.height = "40px";
toggleButton.color = "white";
toggleButton.background = "green";
toggleButton.onPointerClickObservable.add(() => {
    const newValue = !currentValue;
    toggleButton.textBlock.text = newValue ? "Enabled" : "Disabled";
    toggleButton.background = newValue ? "green" : "gray";
    appConfigInstance.setSomeSetting(newValue);
});
```

### 2. RadioGroup Pattern
```typescript
const radioGroup = new SelectionPanel("snapValues");
const options = [
    { value: 0.01, label: "1cm" },
    { value: 0.1, label: "10cm" },
    // ... more options
];

options.forEach(option => {
    const radio = new RadioButton();
    radio.width = "20px";
    radio.height = "20px";
    radio.isChecked = (option.value === currentValue);
    radio.onIsCheckedChangedObservable.add((checked) => {
        if (checked) {
            appConfigInstance.setGridSnap(option.value);
        }
    });
    // Add label next to radio button
});
```

### 3. Config Observer Pattern
```typescript
this._configObserver = appConfigInstance.onConfigChangedObservable.add((config) => {
    this.updateUIFromConfig(config);
});

// In dispose():
if (this._configObserver) {
    appConfigInstance.onConfigChangedObservable.remove(this._configObserver);
}
```

## Key Integration Points

### AppConfig Singleton
- Import: `import {appConfigInstance} from "../util/appConfig";`
- Read: `appConfigInstance.current.locationSnap`
- Write: `appConfigInstance.setGridSnap(0.1)`
- Subscribe: `appConfigInstance.onConfigChangedObservable.add(callback)`

### DiagramMenuManager
- Instantiate panel: `this._vrConfigPanel = new VRConfigPanel(this._scene);`
- Add button to toolbox: Follow exit button pattern in `setupExitButton()`
- Show panel: `this._vrConfigPanel.show();`
- Position panel: Follow pattern in `groundMeshObserver.ts:127-222`

### Handle Pattern
- Make panel grabbable by controllers
- Parent to platform for world movement
- Use `_handleMesh` as root for entire panel UI

## Reference Files

1. **src/menus/configMenu.ts** - Existing VR config implementation with ADT
2. **src/menus/inputTextView.ts** - Handle pattern and ADT setup
3. **src/react/pages/configModal.tsx** - UI structure and config sections
4. **src/util/appConfig.ts** - Config singleton and setter methods
5. **src/diagram/diagramMenuManager.ts** - Toolbox button creation
6. **src/util/functions/groundMeshObserver.ts** - Component positioning

## Success Criteria

- [ ] All 5 config sections implemented and functional
- [ ] Config changes in VR panel update appConfigInstance
- [ ] Config changes propagate to all DiagramObjects
- [ ] Panel is grabbable and repositionable
- [ ] Panel follows platform movement
- [ ] Config persists to localStorage
- [ ] Synchronized with 2D ConfigModal
- [ ] Comfortable viewing experience in VR
- [ ] No memory leaks (proper Observable cleanup)

## Notes

- Start hidden (only show when user clicks toolbox button)
- Position at ~0.5m in front of camera when opened
- Use Y-axis billboard mode to keep panel upright but allow rotation
- Consider adding "Close" button at bottom of panel
- Match color scheme with existing UI (myColor theme)
- Test with both left and right controller grabbing

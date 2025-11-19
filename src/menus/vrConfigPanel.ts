import {
    AdvancedDynamicTexture,
    Button,
    Control,
    Rectangle,
    StackPanel,
    TextBlock
} from "@babylonjs/gui";
import {
    Color3,
    Mesh,
    MeshBuilder,
    Observer,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {appConfigInstance} from "../util/appConfig";
import {AppConfigType, LabelRenderingMode} from "../util/appConfigType";
import log from "loglevel";
import {DefaultScene} from "../defaultScene";
import {Handle} from "../objects/handle";

/**
 * VRConfigPanel - Immersive WebXR configuration panel using AdvancedDynamicTexture
 *
 * Provides a VR-native interface for adjusting application settings including:
 * - Location snap settings
 * - Rotation snap settings
 * - Fly mode toggle
 * - Snap turn settings
 * - Label rendering mode
 *
 * The panel is grabbable via the Handle pattern and integrates with the AppConfig singleton.
 */
export class VRConfigPanel {
    private readonly _logger = log.getLogger('VRConfigPanel');
    private readonly _scene: Scene;
    private readonly _baseTransform: TransformNode;
    private _handle: Handle;
    private _panelMesh: Mesh;
    private _advancedTexture: AdvancedDynamicTexture;
    private _configObserver: Observer<AppConfigType>;
    private _mainContainer: StackPanel;

    // Section content containers (filled in Phases 3-7)
    private _locationSnapContent: StackPanel;
    private _rotationSnapContent: StackPanel;
    private _flyModeContent: StackPanel;
    private _snapTurnContent: StackPanel;
    private _labelModeContent: StackPanel;

    // Location Snap UI controls
    private _locationSnapEnabled: boolean = true;
    private _locationSnapToggle: Button;
    private _locationSnapButtons: Map<number, Button> = new Map();

    // Rotation Snap UI controls
    private _rotationSnapEnabled: boolean = true;
    private _rotationSnapToggle: Button;
    private _rotationSnapButtons: Map<number, Button> = new Map();

    // Fly Mode UI controls
    private _flyModeToggle: Button;

    // Snap Turn UI controls
    private _snapTurnEnabled: boolean = true;
    private _snapTurnToggle: Button;
    private _snapTurnButtons: Map<number, Button> = new Map();

    // Label Rendering Mode UI controls
    private _labelModeButtons: Map<LabelRenderingMode, Button> = new Map();

    constructor(scene: Scene) {
        this._scene = scene || DefaultScene.Scene;
        this._logger.debug('VRConfigPanel constructor called');

        // Create base transform for the entire panel hierarchy
        this._baseTransform = new TransformNode("vrConfigPanelBase", this._scene);

        // Scale down to match toolbox compact size (makes 2m×1.5m panel → 1.2m×0.9m)
        this._baseTransform.scaling = new Vector3(0.6, 0.6, 0.6);

        // Create handle for grabbing (Handle will become parent of baseTransform)
        this._handle = new Handle({
            contentMesh: this._baseTransform,
            label: 'Configuration',
            defaultPosition: new Vector3(.5, 1.5, .5),  // Default position relative to platform
            defaultRotation: new Vector3(0, 0, 0)     // Default rotation
        });

        // Build the panel mesh and UI
        this.buildPanel();

        // Subscribe to config changes
        this._configObserver = appConfigInstance.onConfigChangedObservable.add((config) => {
            this.updateUIFromConfig(config);
        });

        // Start hidden - will be shown when user clicks toolbox button
        this.hide();

        this._logger.debug('VRConfigPanel initialized');
    }

    /**
     * Get the handle's transform node for external positioning
     */
    public get handleMesh(): TransformNode {
        return this._handle.transformNode;
    }

    /**
     * Show the configuration panel
     */
    public show(): void {
        if (this._handle && this._handle.transformNode) {
            this._handle.transformNode.setEnabled(true);
            this._logger.debug('VRConfigPanel shown');
        }
    }

    /**
     * Hide the configuration panel
     */
    public hide(): void {
        if (this._handle && this._handle.transformNode) {
            this._handle.transformNode.setEnabled(false);
            this._logger.debug('VRConfigPanel hidden');
        }
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this._logger.debug('Disposing VRConfigPanel');

        // Remove config observer
        if (this._configObserver) {
            appConfigInstance.onConfigChangedObservable.remove(this._configObserver);
            this._configObserver = null;
        }

        // Dispose of ADT
        if (this._advancedTexture) {
            this._advancedTexture.dispose();
            this._advancedTexture = null;
        }

        // Dispose of mesh
        if (this._panelMesh) {
            this._panelMesh.dispose();
            this._panelMesh = null;
        }

        // Dispose of base transform
        if (this._baseTransform) {
            this._baseTransform.dispose();
        }

        // Handle will be disposed via its parent
        this._handle = null;

        this._logger.debug('VRConfigPanel disposed');
    }

    /**
     * Build the panel mesh and initialize AdvancedDynamicTexture
     */
    private buildPanel(): void {
        this._logger.debug('Building VR config panel');

        // Create panel plane mesh (2m wide x 1.5m tall for comfortable viewing in VR)
        this._panelMesh = MeshBuilder.CreatePlane(
            "vrConfigPanelPlane",
            {
                width: 2.0,
                height: 1.5
            },
            this._scene
        );

        // Parent to base transform
        this._panelMesh.parent = this._baseTransform;

        // Position is now controlled by Handle class
        // Panel is positioned at origin relative to baseTransform

        // Create material for panel backing
        const material = new StandardMaterial("vrConfigPanelMaterial", this._scene);
        material.metadata = { isUI: true };  // Mark as UI to prevent rendering mode modifications
        material.diffuseColor = new Color3(0.1, 0.1, 0.15); // Dark blue-gray
        material.specularColor = new Color3(0.1, 0.1, 0.1);
        this._panelMesh.material = material;

        // Create AdvancedDynamicTexture with high resolution for crisp text in VR
        // Match aspect ratio of plane (2m x 1.5m = 4:3)
        this._advancedTexture = AdvancedDynamicTexture.CreateForMesh(
            this._panelMesh,
            2048,  // Width in pixels
            1536   // Height in pixels (4:3 aspect ratio)
        );

        // Create main container (vertical stack)
        this._mainContainer = new StackPanel("vrConfigMainContainer");
        this._mainContainer.isVertical = true;
        this._mainContainer.width = "100%";
        this._mainContainer.height = "100%";
        this._mainContainer.paddingTop = "40px";
        this._mainContainer.paddingBottom = "40px";
        this._mainContainer.paddingLeft = "60px";
        this._mainContainer.paddingRight = "60px";
        this._advancedTexture.addControl(this._mainContainer);

        // Add title
        const title = new TextBlock("vrConfigTitle", "Configuration");
        title.height = "120px";
        title.fontSize = 80;
        title.color = "white";
        title.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        title.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
        title.paddingBottom = "40px";
        this._mainContainer.addControl(title);

        // Build configuration sections
        this.buildConfigSections();

        this._logger.debug('VR config panel built successfully');
    }

    /**
     * Build all configuration sections with layout structure
     */
    private buildConfigSections(): void {
        // Section 1: Location Snap
        this._locationSnapContent = this.createSectionContainer("Location Snap");
        this.buildLocationSnapControls();
        this.addSeparator();

        // Section 2: Rotation Snap
        this._rotationSnapContent = this.createSectionContainer("Rotation Snap");
        this.buildRotationSnapControls();
        this.addSeparator();

        // Section 3: Fly Mode
        this._flyModeContent = this.createSectionContainer("Fly Mode");
        this.buildFlyModeControls();
        this.addSeparator();

        // Section 4: Snap Turn
        this._snapTurnContent = this.createSectionContainer("Snap Turn");
        this.buildSnapTurnControls();
        this.addSeparator();

        // Section 5: Label Rendering Mode
        this._labelModeContent = this.createSectionContainer("Label Rendering Mode");
        this.buildLabelModeControls();
    }

    /**
     * Create a section container with title
     */
    private createSectionContainer(sectionTitle: string): StackPanel {
        // Create section container
        const section = new StackPanel(`section_${sectionTitle.replace(/\s+/g, '_')}`);
        section.isVertical = true;
        section.width = "100%";
        section.adaptHeightToChildren = true;
        section.paddingTop = "20px";
        section.paddingBottom = "20px";
        this._mainContainer.addControl(section);

        // Add section title
        const titleText = new TextBlock(`title_${sectionTitle.replace(/\s+/g, '_')}`, sectionTitle);
        titleText.height = "60px";
        titleText.fontSize = 60;
        titleText.color = "#4A9EFF";  // Bright blue for section titles
        titleText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        titleText.paddingLeft = "20px";
        titleText.paddingBottom = "10px";
        section.addControl(titleText);

        // Create content container for controls (to be filled in subsequent phases)
        const contentContainer = new StackPanel(`content_${sectionTitle.replace(/\s+/g, '_')}`);
        contentContainer.isVertical = true;
        contentContainer.width = "100%";
        contentContainer.adaptHeightToChildren = true;
        contentContainer.paddingLeft = "40px";
        contentContainer.paddingRight = "40px";
        section.addControl(contentContainer);

        return contentContainer;
    }

    /**
     * Add a visual separator line between sections
     */
    private addSeparator(): void {
        const separator = new Rectangle(`separator_${Date.now()}`);
        separator.height = "2px";
        separator.width = "90%";
        separator.thickness = 0;
        separator.background = "#444444";  // Dark gray separator
        separator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        separator.paddingTop = "10px";
        separator.paddingBottom = "10px";
        this._mainContainer.addControl(separator);
    }

    /**
     * Build Location Snap controls
     */
    private buildLocationSnapControls(): void {
        const currentSnap = appConfigInstance.current.locationSnap;
        this._locationSnapEnabled = currentSnap > 0;

        // Create horizontal container for toggle button
        const toggleContainer = new StackPanel("locationSnapToggleContainer");
        toggleContainer.isVertical = false;
        toggleContainer.width = "100%";
        toggleContainer.height = "80px";
        toggleContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        toggleContainer.paddingBottom = "20px";
        this._locationSnapContent.addControl(toggleContainer);

        // Create toggle button
        this._locationSnapToggle = Button.CreateSimpleButton(
            "locationSnapToggle",
            this._locationSnapEnabled ? "Enabled" : "Disabled"
        );
        this._locationSnapToggle.width = "300px";
        this._locationSnapToggle.height = "70px";
        this._locationSnapToggle.fontSize = 48;
        this._locationSnapToggle.color = "white";
        this._locationSnapToggle.background = this._locationSnapEnabled ? "#4A9EFF" : "#666666";
        this._locationSnapToggle.thickness = 0;
        this._locationSnapToggle.cornerRadius = 10;
        toggleContainer.addControl(this._locationSnapToggle);

        // Toggle button click handler
        this._locationSnapToggle.onPointerClickObservable.add(() => {
            this._locationSnapEnabled = !this._locationSnapEnabled;
            this._locationSnapToggle.textBlock.text = this._locationSnapEnabled ? "Enabled" : "Disabled";
            this._locationSnapToggle.background = this._locationSnapEnabled ? "#4A9EFF" : "#666666";

            if (this._locationSnapEnabled) {
                // Re-enable with last selected value or default
                const lastValue = appConfigInstance.current.locationSnap || 0.1;
                appConfigInstance.setGridSnap(lastValue > 0 ? lastValue : 0.1);
                this.updateLocationSnapButtonStates(lastValue);
            } else {
                // Disable by setting to 0
                appConfigInstance.setGridSnap(0);
                this.updateLocationSnapButtonStates(0);
            }
        });

        // Create horizontal container for snap value buttons
        const valuesContainer = new StackPanel("locationSnapValuesContainer");
        valuesContainer.isVertical = false;
        valuesContainer.width = "100%";
        valuesContainer.height = "80px";
        valuesContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._locationSnapContent.addControl(valuesContainer);

        // Define snap values
        const snapValues = [
            { value: 0.01, label: "1cm" },
            { value: 0.05, label: "5cm" },
            { value: 0.1, label: "10cm" },
            { value: 0.5, label: "50cm" },
            { value: 1.0, label: "1m" }
        ];

        // Create button for each snap value
        snapValues.forEach((snap) => {
            const isSelected = this._locationSnapEnabled && Math.abs(currentSnap - snap.value) < 0.001;

            const btn = Button.CreateSimpleButton(`locationSnap_${snap.value}`, snap.label);
            btn.width = "120px";
            btn.height = "70px";
            btn.fontSize = 42;
            btn.color = "white";
            btn.paddingRight = "10px";
            btn.thickness = 0;
            btn.cornerRadius = 8;

            // Set initial appearance
            if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = this._locationSnapEnabled ? "#333333" : "#222222";
                btn.alpha = this._locationSnapEnabled ? 1.0 : 0.5;
            }

            // Click handler
            btn.onPointerClickObservable.add(() => {
                if (this._locationSnapEnabled) {
                    appConfigInstance.setGridSnap(snap.value);
                    this.updateLocationSnapButtonStates(snap.value);
                }
            });

            this._locationSnapButtons.set(snap.value, btn);
            valuesContainer.addControl(btn);
        });
    }

    /**
     * Update Location Snap button visual states
     */
    private updateLocationSnapButtonStates(selectedValue: number): void {
        this._locationSnapButtons.forEach((btn, value) => {
            const isSelected = this._locationSnapEnabled && Math.abs(selectedValue - value) < 0.001;

            if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = this._locationSnapEnabled ? "#333333" : "#222222";
                btn.fontWeight = "normal";
            }

            btn.alpha = this._locationSnapEnabled ? 1.0 : 0.5;
        });
    }

    /**
     * Build Rotation Snap controls
     */
    private buildRotationSnapControls(): void {
        const currentSnap = appConfigInstance.current.rotateSnap;
        this._rotationSnapEnabled = currentSnap > 0;

        // Create horizontal container for toggle button
        const toggleContainer = new StackPanel("rotationSnapToggleContainer");
        toggleContainer.isVertical = false;
        toggleContainer.width = "100%";
        toggleContainer.height = "80px";
        toggleContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        toggleContainer.paddingBottom = "20px";
        this._rotationSnapContent.addControl(toggleContainer);

        // Create toggle button
        this._rotationSnapToggle = Button.CreateSimpleButton(
            "rotationSnapToggle",
            this._rotationSnapEnabled ? "Enabled" : "Disabled"
        );
        this._rotationSnapToggle.width = "300px";
        this._rotationSnapToggle.height = "70px";
        this._rotationSnapToggle.fontSize = 48;
        this._rotationSnapToggle.color = "white";
        this._rotationSnapToggle.background = this._rotationSnapEnabled ? "#4A9EFF" : "#666666";
        this._rotationSnapToggle.thickness = 0;
        this._rotationSnapToggle.cornerRadius = 10;
        toggleContainer.addControl(this._rotationSnapToggle);

        // Toggle button click handler
        this._rotationSnapToggle.onPointerClickObservable.add(() => {
            this._rotationSnapEnabled = !this._rotationSnapEnabled;
            this._rotationSnapToggle.textBlock.text = this._rotationSnapEnabled ? "Enabled" : "Disabled";
            this._rotationSnapToggle.background = this._rotationSnapEnabled ? "#4A9EFF" : "#666666";

            if (this._rotationSnapEnabled) {
                // Re-enable with last selected value or default
                const lastValue = appConfigInstance.current.rotateSnap || 90;
                appConfigInstance.setRotateSnap(lastValue > 0 ? lastValue : 90);
                this.updateRotationSnapButtonStates(lastValue);
            } else {
                // Disable by setting to 0
                appConfigInstance.setRotateSnap(0);
                this.updateRotationSnapButtonStates(0);
            }
        });

        // Create horizontal container for snap value buttons
        const valuesContainer = new StackPanel("rotationSnapValuesContainer");
        valuesContainer.isVertical = false;
        valuesContainer.width = "100%";
        valuesContainer.height = "80px";
        valuesContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._rotationSnapContent.addControl(valuesContainer);

        // Define rotation snap values
        const snapValues = [
            { value: 22.5, label: "22.5°" },
            { value: 45, label: "45°" },
            { value: 90, label: "90°" },
            { value: 180, label: "180°" },
            { value: 360, label: "360°" }
        ];

        // Create button for each snap value
        snapValues.forEach((snap) => {
            const isSelected = this._rotationSnapEnabled && Math.abs(currentSnap - snap.value) < 0.001;

            const btn = Button.CreateSimpleButton(`rotationSnap_${snap.value}`, snap.label);
            btn.width = "120px";
            btn.height = "70px";
            btn.fontSize = 42;
            btn.color = "white";
            btn.paddingRight = "10px";
            btn.thickness = 0;
            btn.cornerRadius = 8;

            // Set initial appearance
            if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = this._rotationSnapEnabled ? "#333333" : "#222222";
                btn.alpha = this._rotationSnapEnabled ? 1.0 : 0.5;
            }

            // Click handler
            btn.onPointerClickObservable.add(() => {
                if (this._rotationSnapEnabled) {
                    appConfigInstance.setRotateSnap(snap.value);
                    this.updateRotationSnapButtonStates(snap.value);
                }
            });

            this._rotationSnapButtons.set(snap.value, btn);
            valuesContainer.addControl(btn);
        });
    }

    /**
     * Update Rotation Snap button visual states
     */
    private updateRotationSnapButtonStates(selectedValue: number): void {
        this._rotationSnapButtons.forEach((btn, value) => {
            const isSelected = this._rotationSnapEnabled && Math.abs(selectedValue - value) < 0.001;

            if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = this._rotationSnapEnabled ? "#333333" : "#222222";
                btn.fontWeight = "normal";
            }

            btn.alpha = this._rotationSnapEnabled ? 1.0 : 0.5;
        });
    }

    /**
     * Build Fly Mode controls
     */
    private buildFlyModeControls(): void {
        const flyModeEnabled = appConfigInstance.current.flyMode;

        // Create horizontal container for toggle button
        const toggleContainer = new StackPanel("flyModeToggleContainer");
        toggleContainer.isVertical = false;
        toggleContainer.width = "100%";
        toggleContainer.height = "80px";
        toggleContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._flyModeContent.addControl(toggleContainer);

        // Create toggle button
        this._flyModeToggle = Button.CreateSimpleButton(
            "flyModeToggle",
            flyModeEnabled ? "Fly Mode Enabled" : "Fly Mode Disabled"
        );
        this._flyModeToggle.width = "400px";
        this._flyModeToggle.height = "70px";
        this._flyModeToggle.fontSize = 48;
        this._flyModeToggle.color = "white";
        this._flyModeToggle.background = flyModeEnabled ? "#4A9EFF" : "#666666";
        this._flyModeToggle.thickness = 0;
        this._flyModeToggle.cornerRadius = 10;
        toggleContainer.addControl(this._flyModeToggle);

        // Toggle button click handler
        this._flyModeToggle.onPointerClickObservable.add(() => {
            const newValue = !appConfigInstance.current.flyMode;
            appConfigInstance.setFlyMode(newValue);
            this._flyModeToggle.textBlock.text = newValue ? "Fly Mode Enabled" : "Fly Mode Disabled";
            this._flyModeToggle.background = newValue ? "#4A9EFF" : "#666666";
        });
    }

    /**
     * Build Snap Turn controls
     */
    private buildSnapTurnControls(): void {
        const currentSnap = appConfigInstance.current.turnSnap;
        this._snapTurnEnabled = currentSnap > 0;

        // Create horizontal container for toggle button
        const toggleContainer = new StackPanel("snapTurnToggleContainer");
        toggleContainer.isVertical = false;
        toggleContainer.width = "100%";
        toggleContainer.height = "80px";
        toggleContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        toggleContainer.paddingBottom = "20px";
        this._snapTurnContent.addControl(toggleContainer);

        // Create toggle button
        this._snapTurnToggle = Button.CreateSimpleButton(
            "snapTurnToggle",
            this._snapTurnEnabled ? "Enabled" : "Disabled"
        );
        this._snapTurnToggle.width = "300px";
        this._snapTurnToggle.height = "70px";
        this._snapTurnToggle.fontSize = 48;
        this._snapTurnToggle.color = "white";
        this._snapTurnToggle.background = this._snapTurnEnabled ? "#4A9EFF" : "#666666";
        this._snapTurnToggle.thickness = 0;
        this._snapTurnToggle.cornerRadius = 10;
        toggleContainer.addControl(this._snapTurnToggle);

        // Toggle button click handler
        this._snapTurnToggle.onPointerClickObservable.add(() => {
            this._snapTurnEnabled = !this._snapTurnEnabled;
            this._snapTurnToggle.textBlock.text = this._snapTurnEnabled ? "Enabled" : "Disabled";
            this._snapTurnToggle.background = this._snapTurnEnabled ? "#4A9EFF" : "#666666";

            if (this._snapTurnEnabled) {
                // Re-enable with last selected value or default
                const lastValue = appConfigInstance.current.turnSnap || 45;
                appConfigInstance.setTurnSnap(lastValue > 0 ? lastValue : 45);
                this.updateSnapTurnButtonStates(lastValue);
            } else {
                // Disable by setting to 0
                appConfigInstance.setTurnSnap(0);
                this.updateSnapTurnButtonStates(0);
            }
        });

        // Create horizontal container for snap value buttons
        const valuesContainer = new StackPanel("snapTurnValuesContainer");
        valuesContainer.isVertical = false;
        valuesContainer.width = "100%";
        valuesContainer.height = "80px";
        valuesContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._snapTurnContent.addControl(valuesContainer);

        // Define snap turn values (same as rotation snap)
        const snapValues = [
            { value: 22.5, label: "22.5°" },
            { value: 45, label: "45°" },
            { value: 90, label: "90°" },
            { value: 180, label: "180°" },
            { value: 360, label: "360°" }
        ];

        // Create button for each snap value
        snapValues.forEach((snap) => {
            const isSelected = this._snapTurnEnabled && Math.abs(currentSnap - snap.value) < 0.001;

            const btn = Button.CreateSimpleButton(`snapTurn_${snap.value}`, snap.label);
            btn.width = "120px";
            btn.height = "70px";
            btn.fontSize = 42;
            btn.color = "white";
            btn.paddingRight = "10px";
            btn.thickness = 0;
            btn.cornerRadius = 8;

            // Set initial appearance
            if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = this._snapTurnEnabled ? "#333333" : "#222222";
                btn.alpha = this._snapTurnEnabled ? 1.0 : 0.5;
            }

            // Click handler
            btn.onPointerClickObservable.add(() => {
                if (this._snapTurnEnabled) {
                    appConfigInstance.setTurnSnap(snap.value);
                    this.updateSnapTurnButtonStates(snap.value);
                }
            });

            this._snapTurnButtons.set(snap.value, btn);
            valuesContainer.addControl(btn);
        });
    }

    /**
     * Update Snap Turn button visual states
     */
    private updateSnapTurnButtonStates(selectedValue: number): void {
        this._snapTurnButtons.forEach((btn, value) => {
            const isSelected = this._snapTurnEnabled && Math.abs(selectedValue - value) < 0.001;

            if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = this._snapTurnEnabled ? "#333333" : "#222222";
                btn.fontWeight = "normal";
            }

            btn.alpha = this._snapTurnEnabled ? 1.0 : 0.5;
        });
    }

    /**
     * Build Label Rendering Mode controls
     */
    private buildLabelModeControls(): void {
        const currentMode = appConfigInstance.current.labelRenderingMode || 'billboard';

        // Create vertical container for mode buttons
        const modesContainer = new StackPanel("labelModesContainer");
        modesContainer.isVertical = true;
        modesContainer.width = "100%";
        modesContainer.adaptHeightToChildren = true;
        this._labelModeContent.addControl(modesContainer);

        // Define label rendering modes
        const modes: Array<{ value: LabelRenderingMode, label: string, disabled: boolean }> = [
            { value: 'fixed', label: 'Fixed', disabled: false },
            { value: 'billboard', label: 'Billboard (Always Face Camera)', disabled: false },
            { value: 'dynamic', label: 'Dynamic (Coming Soon)', disabled: true },
            { value: 'distance', label: 'Distance-based (Coming Soon)', disabled: true }
        ];

        // Create button for each mode
        modes.forEach((mode) => {
            const isSelected = currentMode === mode.value;

            const btn = Button.CreateSimpleButton(`labelMode_${mode.value}`, mode.label);
            btn.width = "100%";
            btn.height = "70px";
            btn.fontSize = 42;
            btn.color = "white";
            btn.paddingBottom = "10px";
            btn.thickness = 0;
            btn.cornerRadius = 8;

            // Set initial appearance
            if (mode.disabled) {
                btn.background = "#222222";
                btn.alpha = 0.5;
                btn.color = "#888888";
            } else if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
            } else {
                btn.background = "#333333";
            }

            // Click handler (only for enabled modes)
            if (!mode.disabled) {
                btn.onPointerClickObservable.add(() => {
                    appConfigInstance.setLabelRenderingMode(mode.value);
                    this.updateLabelModeButtonStates(mode.value);
                });
            }

            this._labelModeButtons.set(mode.value, btn);
            modesContainer.addControl(btn);
        });
    }

    /**
     * Update Label Rendering Mode button visual states
     */
    private updateLabelModeButtonStates(selectedValue: LabelRenderingMode): void {
        this._labelModeButtons.forEach((btn, value) => {
            const isSelected = selectedValue === value;
            const isDisabled = value === 'dynamic' || value === 'distance';

            if (isDisabled) {
                // Keep disabled appearance
                btn.background = "#222222";
                btn.alpha = 0.5;
                btn.color = "#888888";
                btn.fontWeight = "normal";
            } else if (isSelected) {
                btn.background = "#4A9EFF";
                btn.fontWeight = "bold";
                btn.color = "white";
            } else {
                btn.background = "#333333";
                btn.fontWeight = "normal";
                btn.color = "white";
            }
        });
    }


    /**
     * Update all UI elements to reflect current config
     * Called when config changes externally
     */
    private updateUIFromConfig(config: AppConfigType): void {
        this._logger.debug('Updating UI from config', config);

        // Update Location Snap UI
        if (this._locationSnapToggle && this._locationSnapButtons.size > 0) {
            this._locationSnapEnabled = config.locationSnap > 0;
            this._locationSnapToggle.textBlock.text = this._locationSnapEnabled ? "Enabled" : "Disabled";
            this._locationSnapToggle.background = this._locationSnapEnabled ? "#4A9EFF" : "#666666";
            this.updateLocationSnapButtonStates(config.locationSnap);
        }

        // Update Rotation Snap UI
        if (this._rotationSnapToggle && this._rotationSnapButtons.size > 0) {
            this._rotationSnapEnabled = config.rotateSnap > 0;
            this._rotationSnapToggle.textBlock.text = this._rotationSnapEnabled ? "Enabled" : "Disabled";
            this._rotationSnapToggle.background = this._rotationSnapEnabled ? "#4A9EFF" : "#666666";
            this.updateRotationSnapButtonStates(config.rotateSnap);
        }

        // Update Fly Mode UI
        if (this._flyModeToggle) {
            this._flyModeToggle.textBlock.text = config.flyMode ? "Fly Mode Enabled" : "Fly Mode Disabled";
            this._flyModeToggle.background = config.flyMode ? "#4A9EFF" : "#666666";
        }

        // Update Snap Turn UI
        if (this._snapTurnToggle && this._snapTurnButtons.size > 0) {
            this._snapTurnEnabled = config.turnSnap > 0;
            this._snapTurnToggle.textBlock.text = this._snapTurnEnabled ? "Enabled" : "Disabled";
            this._snapTurnToggle.background = this._snapTurnEnabled ? "#4A9EFF" : "#666666";
            this.updateSnapTurnButtonStates(config.turnSnap);
        }

        // Update Label Rendering Mode UI
        if (this._labelModeButtons.size > 0 && config.labelRenderingMode) {
            this.updateLabelModeButtonStates(config.labelRenderingMode);
        }
    }
}

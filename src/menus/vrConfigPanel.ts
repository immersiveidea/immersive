import {
    AdvancedDynamicTexture,
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
import {AppConfigType} from "../util/appConfigType";
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

    constructor(scene: Scene) {
        this._scene = scene || DefaultScene.Scene;
        this._logger.debug('VRConfigPanel constructor called');

        // Create base transform for the entire panel hierarchy
        this._baseTransform = new TransformNode("vrConfigPanelBase", this._scene);

        // Create handle for grabbing (Handle will become parent of baseTransform)
        this._handle = new Handle(
            this._baseTransform,
            'Configuration',
            new Vector3(0.5, 1.6, 0.4),  // Default position relative to platform
            new Vector3(0.5, 0.6, 0)     // Default rotation
        );

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

        // Position slightly forward and up from handle
        this._panelMesh.position = new Vector3(0, 0.2, 0);

        // Create material for panel backing
        const material = new StandardMaterial("vrConfigPanelMaterial", this._scene);
        material.diffuseColor = new Color3(0.1, 0.1, 0.15); // Dark blue-gray
        material.specularColor = new Color3(0.1, 0.1, 0.1);
        this._panelMesh.material = material;

        // Create AdvancedDynamicTexture with high resolution for crisp text in VR
        this._advancedTexture = AdvancedDynamicTexture.CreateForMesh(
            this._panelMesh,
            2048,  // Width in pixels
            2048   // Height in pixels (square for now, will adjust if needed)
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

        // Parent handle to platform when available
        this.setupPlatformParenting();

        this._logger.debug('VR config panel built successfully');
    }

    /**
     * Build all configuration sections with layout structure
     */
    private buildConfigSections(): void {
        // Section 1: Location Snap
        this._locationSnapContent = this.createSectionContainer("Location Snap");
        this.addSeparator();

        // Section 2: Rotation Snap
        this._rotationSnapContent = this.createSectionContainer("Rotation Snap");
        this.addSeparator();

        // Section 3: Fly Mode
        this._flyModeContent = this.createSectionContainer("Fly Mode");
        this.addSeparator();

        // Section 4: Snap Turn
        this._snapTurnContent = this.createSectionContainer("Snap Turn");
        this.addSeparator();

        // Section 5: Label Rendering Mode
        this._labelModeContent = this.createSectionContainer("Label Rendering Mode");
    }

    /**
     * Create a section container with title
     */
    private createSectionContainer(sectionTitle: string): StackPanel {
        // Create section container
        const section = new StackPanel(`section_${sectionTitle.replace(/\s+/g, '_')}`);
        section.isVertical = true;
        section.width = "100%";
        section.height = "auto";
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
        contentContainer.height = "auto";
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
     * Set up parenting to platform for world movement tracking
     */
    private setupPlatformParenting(): void {
        const platform = this._scene.getMeshById('platform');
        if (platform) {
            this._handle.transformNode.parent = platform;
            this._logger.debug('VRConfigPanel parented to existing platform');
        } else {
            // Wait for platform to be added
            const handler = this._scene.onNewMeshAddedObservable.add((mesh) => {
                if (mesh && mesh.id === 'platform') {
                    this._handle.transformNode.parent = mesh;
                    this._logger.debug('VRConfigPanel parented to newly added platform');
                    this._scene.onNewMeshAddedObservable.remove(handler);
                }
            });
        }
    }

    /**
     * Update all UI elements to reflect current config
     * Called when config changes externally
     */
    private updateUIFromConfig(config: AppConfigType): void {
        this._logger.debug('Updating UI from config', config);

        // UI update logic will be implemented in subsequent phases
        // For now, just log the config change

        // Phase 3-7 will add:
        // - Location snap UI update
        // - Rotation snap UI update
        // - Fly mode UI update
        // - Snap turn UI update
        // - Label rendering mode UI update
    }
}

/**
 * Feature configuration system for controlling access to pages, features, and limits
 * based on user tier/subscription level.
 */

export type UserTier = 'none' | 'free' | 'basic' | 'pro';

export type FeatureState = 'on' | 'coming-soon' | 'basic' | 'pro' | 'off';

export interface PageFlags {
    examples: FeatureState;
    documentation: FeatureState;
    pricing: FeatureState;
    vrExperience: FeatureState;
}

export interface FeatureFlags {
    createDiagram: FeatureState;
    createFromTemplate: FeatureState;
    manageDiagrams: FeatureState;
    shareCollaborate: FeatureState;
    privateDesigns: FeatureState;
    encryptedDesigns: FeatureState;
    editData: FeatureState;
    config: FeatureState;
    enterImmersive: FeatureState;
    launchMetaQuest: FeatureState;
}

export interface LimitFlags {
    maxDiagrams: number;
    maxCollaborators: number;
    storageQuotaMB: number;
}

export interface FeatureConfig {
    tier: UserTier;
    pages: PageFlags;
    features: FeatureFlags;
    limits: LimitFlags;
}

/**
 * Default configuration for unauthenticated users (guest mode).
 * Allows limited access with local storage only (no sync/collaboration).
 */
export const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
    tier: 'none',
    pages: {
        examples: 'coming-soon',
        documentation: 'coming-soon',
        pricing: 'coming-soon',
        vrExperience: 'on', // Allow VR experience for guests
    },
    features: {
        createDiagram: 'basic',           // Guests can create diagrams
        createFromTemplate: 'coming-soon',  // Coming soon for guests
        manageDiagrams: 'basic',          // Guests can manage their local diagrams
        shareCollaborate: 'coming-soon', // Coming soon for guests
        privateDesigns: 'coming-soon',   // Coming soon for guests
        encryptedDesigns: 'pro',       // No encryption for guests
        editData: 'coming-soon',                // Guests can edit data
        config: 'on',                  // Guests can access settings
        enterImmersive: 'on',          // Guests can enter immersive mode
        launchMetaQuest: 'on',         // Guests can launch on Meta Quest
    },
    limits: {
        maxDiagrams: 3,                // Guests limited to 3 diagrams
        maxCollaborators: 0,           // No collaboration for guests
        storageQuotaMB: 50,            // 50MB local storage for guests
    },
};

export const BASIC_FEATURE_CONFIG: FeatureConfig = {
    tier: 'basic',
    pages: {
        examples: 'off',
        documentation: 'off',
        pricing: 'coming-soon',
        vrExperience: 'on',
    },
    features: {
        createDiagram: 'on',
        createFromTemplate: 'off',
        manageDiagrams: 'off',
        shareCollaborate: 'off',
        privateDesigns: 'off',
        encryptedDesigns: 'off',
        editData: 'off',
        config: 'off',
        enterImmersive: 'off',
        launchMetaQuest: 'off',
    },
    limits: {
        maxDiagrams: 0,
        maxCollaborators: 0,
        storageQuotaMB: 0,
    },
};

/**
 * Type guard to check if a page name is valid
 */
export function isValidPage(page: string): page is keyof PageFlags {
    return page in DEFAULT_FEATURE_CONFIG.pages;
}

/**
 * Type guard to check if a feature name is valid
 */
export function isValidFeature(feature: string): feature is keyof FeatureFlags {
    return feature in DEFAULT_FEATURE_CONFIG.features;
}

/**
 * Type guard to check if a limit name is valid
 */
export function isValidLimit(limit: string): limit is keyof LimitFlags {
    return limit in DEFAULT_FEATURE_CONFIG.limits;
}

/**
 * Helper to check if a page is enabled (on) in the config
 */
export function isPageEnabled(config: FeatureConfig, page: keyof PageFlags): boolean {
    return config.pages[page] === 'on';
}

/**
 * Helper to check if a feature is enabled (on) in the config
 */
export function isFeatureEnabled(config: FeatureConfig, feature: keyof FeatureFlags): boolean {
    return config.features[feature] === 'on';
}

/**
 * Helper to check if a page or feature should be visible (not 'off')
 */
export function shouldShowPage(config: FeatureConfig, page: keyof PageFlags): boolean {
    return config.pages[page] !== 'off';
}

/**
 * Helper to check if a feature should be visible (not 'off')
 */
export function shouldShowFeature(config: FeatureConfig, feature: keyof FeatureFlags): boolean {
    return config.features[feature] !== 'off';
}

/**
 * Helper to get the state of a page
 */
export function getPageState(config: FeatureConfig, page: keyof PageFlags): FeatureState {
    return config.pages[page];
}

/**
 * Helper to get the state of a feature
 */
export function getFeatureState(config: FeatureConfig, feature: keyof FeatureFlags): FeatureState {
    return config.features[feature];
}

/**
 * Helper to get a limit value from the config
 */
export function getFeatureLimit(config: FeatureConfig, limit: keyof LimitFlags): number {
    return config.limits[limit];
}

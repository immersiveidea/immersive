/**
 * Feature configuration system for controlling access to pages, features, and limits
 * based on user tier/subscription level.
 */

export type UserTier = 'none' | 'free' | 'basic' | 'pro';

export interface PageFlags {
    examples: boolean;
    documentation: boolean;
    pricing: boolean;
    vrExperience: boolean;
}

export interface FeatureFlags {
    createDiagram: boolean;
    createFromTemplate: boolean;
    manageDiagrams: boolean;
    shareCollaborate: boolean;
    privateDesigns: boolean;
    encryptedDesigns: boolean;
    editData: boolean;
    config: boolean;
    enterImmersive: boolean;
    launchMetaQuest: boolean;
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
 * Default configuration for unauthenticated users or when API fetch fails.
 * Everything is disabled except the home page.
 */
export const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
    tier: 'none',
    pages: {
        examples: false,
        documentation: false,
        pricing: false,
        vrExperience: false,
    },
    features: {
        createDiagram: false,
        createFromTemplate: false,
        manageDiagrams: false,
        shareCollaborate: false,
        privateDesigns: false,
        encryptedDesigns: false,
        editData: false,
        config: false,
        enterImmersive: false,
        launchMetaQuest: false,
    },
    limits: {
        maxDiagrams: 0,
        maxCollaborators: 0,
        storageQuotaMB: 0,
    },
};

/**
 * Guest mode configuration for unauthenticated users.
 * Allows limited access with local storage only (no sync/collaboration).
 */
export const GUEST_FEATURE_CONFIG: FeatureConfig = {
    tier: 'none',
    pages: {
        examples: false,
        documentation: false,
        pricing: false,
        vrExperience: true, // Allow VR experience for guests
    },
    features: {
        createDiagram: true,        // Guests can create diagrams
        createFromTemplate: false,  // No templates for guests
        manageDiagrams: true,        // Guests can manage their local diagrams
        shareCollaborate: false,     // No sharing/collaboration for guests
        privateDesigns: false,       // No private designs (local only anyway)
        encryptedDesigns: false,     // No encryption for guests
        editData: true,              // Guests can edit data
        config: true,                // Guests can access settings
        enterImmersive: true,        // Guests can enter immersive mode
        launchMetaQuest: true,       // Guests can launch on Meta Quest
    },
    limits: {
        maxDiagrams: 3,              // Guests limited to 3 diagrams
        maxCollaborators: 0,         // No collaboration for guests
        storageQuotaMB: 50,          // 50MB local storage for guests
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
 * Helper to check if a page is enabled in the config
 */
export function isPageEnabled(config: FeatureConfig, page: keyof PageFlags): boolean {
    return config.pages[page];
}

/**
 * Helper to check if a feature is enabled in the config
 */
export function isFeatureEnabled(config: FeatureConfig, feature: keyof FeatureFlags): boolean {
    return config.features[feature];
}

/**
 * Helper to get a limit value from the config
 */
export function getFeatureLimit(config: FeatureConfig, limit: keyof LimitFlags): number {
    return config.limits[limit];
}

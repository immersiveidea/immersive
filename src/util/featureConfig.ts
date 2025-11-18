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

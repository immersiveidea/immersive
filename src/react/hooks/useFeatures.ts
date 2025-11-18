import { useContext } from 'react';
import { FeatureContext } from '../contexts/FeatureContext';
import { FeatureFlags, PageFlags, LimitFlags } from '../../util/featureConfig';

/**
 * Hook to access the full feature configuration context
 */
export function useFeatures() {
    const context = useContext(FeatureContext);

    if (!context) {
        throw new Error('useFeatures must be used within a FeatureProvider');
    }

    return context;
}

/**
 * Hook to check if a specific page is enabled
 */
export function useIsPageEnabled(page: keyof PageFlags): boolean {
    const { config } = useFeatures();
    return config.pages[page];
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useIsFeatureEnabled(feature: keyof FeatureFlags): boolean {
    const { config } = useFeatures();
    return config.features[feature];
}

/**
 * Hook to get a specific limit value
 */
export function useFeatureLimit(limit: keyof LimitFlags): number {
    const { config } = useFeatures();
    return config.limits[limit];
}

/**
 * Hook to get the current user tier
 */
export function useUserTier() {
    const { config } = useFeatures();
    return config.tier;
}

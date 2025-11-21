import { useContext } from 'react';
import { FeatureContext } from '../contexts/FeatureContext';
import { FeatureFlags, FeatureState, LimitFlags, PageFlags } from '../../util/featureConfig';

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
 * Hook to get the state of a specific page
 */
export function usePageState(page: keyof PageFlags): FeatureState {
    const { config } = useFeatures();
    return config.pages[page];
}

/**
 * Hook to get the state of a specific feature
 */
export function useFeatureState(feature: keyof FeatureFlags): FeatureState {
    const { config } = useFeatures();
    return config.features[feature];
}

/**
 * Hook to check if a specific page is enabled (on)
 */
export function useIsPageEnabled(page: keyof PageFlags): boolean {
    const { config } = useFeatures();
    return config.pages[page] === 'on';
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

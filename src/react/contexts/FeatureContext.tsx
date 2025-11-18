import { createContext } from 'react';
import { FeatureConfig, DEFAULT_FEATURE_CONFIG } from '../../util/featureConfig';

export interface FeatureContextValue {
    config: FeatureConfig;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export const FeatureContext = createContext<FeatureContextValue>({
    config: DEFAULT_FEATURE_CONFIG,
    isLoading: false,
    error: null,
    refetch: async () => {},
});

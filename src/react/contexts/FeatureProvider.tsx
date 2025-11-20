import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { FeatureContext } from './FeatureContext';
import { FeatureConfig, DEFAULT_FEATURE_CONFIG, GUEST_FEATURE_CONFIG } from '../../util/featureConfig';
import log from 'loglevel';

const logger = log.getLogger('FeatureProvider');

interface FeatureProviderProps {
    children: ReactNode;
}

/**
 * Fetches feature configuration from the API endpoint
 */
async function fetchFeatureConfig(accessToken: string | undefined): Promise<FeatureConfig> {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Include auth token if available
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch('/api/user/features', {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logger.info('User not authenticated or not authorized, using default config');
                return DEFAULT_FEATURE_CONFIG;
            }
            throw new Error(`Failed to fetch feature config: ${response.status} ${response.statusText}`);
        }

        const config: FeatureConfig = await response.json();
        logger.info('Feature config loaded:', config);
        return config;
    } catch (error) {
        logger.error('Error fetching feature config:', error);
        throw error;
    }
}

export function FeatureProvider({ children }: FeatureProviderProps) {
    const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
    const [config, setConfig] = useState<FeatureConfig>(GUEST_FEATURE_CONFIG); // Start with guest config
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadFeatures = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let accessToken: string | undefined;

            if (isAuthenticated) {
                try {
                    accessToken = await getAccessTokenSilently();
                } catch (err) {
                    logger.warn('Failed to get access token:', err);
                }
            }

            // If not authenticated, use guest config
            if (!isAuthenticated) {
                logger.info('User not authenticated, using guest config');
                setConfig(GUEST_FEATURE_CONFIG);
                setIsLoading(false);
                return;
            }

            const fetchedConfig = await fetchFeatureConfig(accessToken);
            setConfig(fetchedConfig);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error fetching features');
            setError(error);
            // On error, fallback to guest config for better UX
            logger.warn('Error loading features, falling back to guest config');
            setConfig(GUEST_FEATURE_CONFIG);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, getAccessTokenSilently]);

    // Load features when auth state changes
    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        loadFeatures();
    }, [authLoading, loadFeatures]);

    const contextValue = {
        config,
        isLoading,
        error,
        refetch: loadFeatures,
    };

    return (
        <FeatureContext.Provider value={contextValue}>
            {children}
        </FeatureContext.Provider>
    );
}

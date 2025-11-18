import React, { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsPageEnabled } from '../hooks/useFeatures';
import { PageFlags } from '../../util/featureConfig';

interface ProtectedRouteProps {
    page: keyof PageFlags;
    children: ReactElement;
}

/**
 * Route guard component that redirects to home if the page is not enabled
 */
export function ProtectedRoute({ page, children }: ProtectedRouteProps) {
    const isEnabled = useIsPageEnabled(page);

    if (!isEnabled) {
        // Redirect to home page if feature is not enabled
        return <Navigate to="/" replace />;
    }

    return children;
}

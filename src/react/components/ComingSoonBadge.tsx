import React from 'react';
import { Badge } from '@mantine/core';

interface ComingSoonBadgeProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Small pill badge to indicate a feature or page is coming soon
 */
export default function ComingSoonBadge({ size = 'sm' }: ComingSoonBadgeProps) {
    return (
        <Badge
            size={size}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            style={{ marginLeft: '8px' }}
        >
            Coming Soon!
        </Badge>
    );
}

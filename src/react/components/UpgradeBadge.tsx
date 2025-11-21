import React from 'react';
import { Badge } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';

interface UpgradeBadgeProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    tier?: 'basic' | 'pro';
    onClick?: () => void;
}

/**
 * Small pill badge to indicate a feature requires sign up or upgrade
 */
export default function UpgradeBadge({ size = 'sm', tier, onClick }: UpgradeBadgeProps) {
    const tierLabel = tier === 'basic' ? 'Sign Up for Free' : tier === 'pro' ? 'Upgrade to Pro' : 'Upgrade';
    const gradient = tier === 'pro'
        ? { from: 'yellow', to: 'orange', deg: 90 }
        : { from: 'indigo', to: 'grape', deg: 90 };

    return (
        <Badge
            size={size}
            variant="gradient"
            gradient={gradient}
            style={{
                marginLeft: '8px',
                cursor: onClick ? 'pointer' : 'default'
            }}
            rightSection={tier === 'pro' ? <IconStar size={12} /> : undefined}
            onClick={onClick}
        >
            {tierLabel}
        </Badge>
    );
}

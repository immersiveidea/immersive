/**
 * Copy and messaging for upgrade paths and guest limitations
 */

export interface UpgradeBenefit {
    title: string;
    description: string;
    icon?: string;
}

export const GUEST_LIMITATIONS = {
    diagrams: {
        limit: 3,
        message: 'Guest mode is limited to 3 diagrams',
        upgradeMessage: 'Sign up for unlimited diagrams',
    },
    storage: {
        limit: 50, // MB
        message: 'Guest mode uses 50MB local storage',
        upgradeMessage: 'Get cloud storage with sync',
    },
    collaboration: {
        message: 'Collaboration features are disabled in guest mode',
        upgradeMessage: 'Sign up to collaborate with your team',
    },
    sync: {
        message: 'Changes are stored locally only',
        upgradeMessage: 'Sign up to sync across all your devices',
    },
    templates: {
        message: 'Templates are not available in guest mode',
        upgradeMessage: 'Sign up to access our template library',
    },
};

export const UPGRADE_BENEFITS: UpgradeBenefit[] = [
    {
        title: 'Unlimited Diagrams',
        description: 'Create as many diagrams as you need without limits',
    },
    {
        title: 'Cloud Sync',
        description: 'Access your work from desktop, VR headset, and any device',
    },
    {
        title: 'Real-Time Collaboration',
        description: 'Work together with your team in the same 3D space',
    },
    {
        title: 'Template Library',
        description: 'Jump-start your projects with pre-built templates',
    },
    {
        title: 'Secure Cloud Storage',
        description: 'Your diagrams safely backed up and encrypted',
    },
    {
        title: 'Priority Support',
        description: 'Get help when you need it from our support team',
    },
];

export const GUEST_MODE_BANNER = {
    title: 'You\'re in Guest Mode',
    message: 'Your diagrams are saved locally. Sign up to sync across devices and collaborate with teams.',
    ctaText: 'Sign Up Free',
};

export const UPGRADE_CTA = {
    hero: {
        title: 'Ready to unlock the full experience?',
        subtitle: 'Sign up free to sync across devices, collaborate with teams, and create unlimited diagrams.',
        primaryCta: 'Sign Up Free',
        secondaryCta: 'Learn More',
    },
    inline: {
        title: 'Want more?',
        message: 'Sign up to unlock unlimited diagrams, cloud sync, and collaboration.',
        ctaText: 'Sign Up',
    },
    limit: {
        diagrams: {
            title: 'Diagram Limit Reached',
            message: 'You\'ve created 3 diagrams (guest limit). Sign up to create unlimited diagrams.',
            ctaText: 'Upgrade Now',
        },
    },
};

/**
 * Get the appropriate upgrade message based on context
 */
export function getUpgradeMessage(context: 'diagram-limit' | 'collaboration' | 'sync' | 'template'): {
    title: string;
    message: string;
    benefits: string[];
} {
    switch (context) {
        case 'diagram-limit':
            return {
                title: 'Unlock Unlimited Diagrams',
                message: 'Guest mode is limited to 3 diagrams. Sign up to create as many as you need.',
                benefits: [
                    'Create unlimited diagrams',
                    'Cloud storage and backup',
                    'Access from any device',
                    'Real-time collaboration',
                ],
            };
        case 'collaboration':
            return {
                title: 'Collaborate in Real-Time',
                message: 'Work together with your team in shared 3D space.',
                benefits: [
                    'Invite unlimited collaborators',
                    'See changes in real-time',
                    'Meet as avatars in VR',
                    'Audit trail of all changes',
                ],
            };
        case 'sync':
            return {
                title: 'Sync Across All Devices',
                message: 'Access your diagrams from desktop, VR, and mobile.',
                benefits: [
                    'Cloud sync across devices',
                    'Work on Quest and desktop',
                    'Automatic backups',
                    'Secure cloud storage',
                ],
            };
        case 'template':
            return {
                title: 'Get Started Faster',
                message: 'Access pre-built templates for common use cases.',
                benefits: [
                    'Professional templates',
                    'Org charts and workflows',
                    'Architecture diagrams',
                    'Customizable examples',
                ],
            };
    }
}

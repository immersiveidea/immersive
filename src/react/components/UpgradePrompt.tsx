import {Alert, Button, Group, Text} from "@mantine/core";
import {IconSparkles, IconX} from "@tabler/icons-react";
import {useState, useEffect} from "react";
import {useAuth0} from "@auth0/auth0-react";

export interface UpgradePromptProps {
    reason: 'diagram-limit' | 'share-feature' | 'sync-feature' | 'template-feature';
    onDismiss?: () => void;
}

const PROMPT_MESSAGES = {
    'diagram-limit': {
        title: 'Diagram Limit Reached',
        message: 'You\'ve reached the 3 diagram limit for guest mode. Sign up to create unlimited diagrams and sync across devices!',
    },
    'share-feature': {
        title: 'Collaboration Requires Sign Up',
        message: 'Share and collaborate with your team in real-time. Sign up to unlock collaboration features!',
    },
    'sync-feature': {
        title: 'Sync Across Devices',
        message: 'Access your diagrams from any device. Sign up to enable cloud sync between desktop and VR!',
    },
    'template-feature': {
        title: 'Templates Available',
        message: 'Get started faster with pre-built templates. Sign up to access our template library!',
    },
};

const SESSION_STORAGE_KEY = 'upgrade-prompts-dismissed';

export function UpgradePrompt({ reason, onDismiss }: UpgradePromptProps) {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const [visible, setVisible] = useState(true);
    const message = PROMPT_MESSAGES[reason];

    useEffect(() => {
        // Check if this prompt was already dismissed in this session
        const dismissed = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (dismissed) {
            try {
                const dismissedReasons = JSON.parse(dismissed);
                if (dismissedReasons.includes(reason)) {
                    setVisible(false);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, [reason]);

    const handleDismiss = () => {
        // Mark as dismissed for this session
        const dismissed = sessionStorage.getItem(SESSION_STORAGE_KEY);
        let dismissedReasons: string[] = [];
        if (dismissed) {
            try {
                dismissedReasons = JSON.parse(dismissed);
            } catch {
                // Ignore parse errors
            }
        }
        if (!dismissedReasons.includes(reason)) {
            dismissedReasons.push(reason);
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dismissedReasons));
        setVisible(false);
        onDismiss?.();
    };

    const handleSignUp = () => {
        loginWithRedirect({
            appState: { returnTo: window.location.pathname }
        });
    };

    // Don't show if already authenticated or dismissed
    if (!visible || isAuthenticated) {
        return null;
    }

    return (
        <Alert
            variant="light"
            color="blue"
            title={message.title}
            icon={<IconSparkles size={20} />}
            withCloseButton
            onClose={handleDismiss}
            mb="md"
        >
            <Text size="sm" mb="sm">
                {message.message}
            </Text>
            <Group gap="xs">
                <Button
                    size="xs"
                    onClick={handleSignUp}
                    leftSection={<IconSparkles size={16} />}
                >
                    Sign Up Free
                </Button>
                <Button
                    size="xs"
                    variant="subtle"
                    onClick={handleDismiss}
                    leftSection={<IconX size={16} />}
                >
                    Maybe Later
                </Button>
            </Group>
        </Alert>
    );
}

/**
 * Hook to trigger upgrade prompts based on conditions
 */
export function useUpgradePrompt() {
    const [promptReason, setPromptReason] = useState<UpgradePromptProps['reason'] | null>(null);

    const showPrompt = (reason: UpgradePromptProps['reason']) => {
        setPromptReason(reason);
    };

    const hidePrompt = () => {
        setPromptReason(null);
    };

    return {
        promptReason,
        showPrompt,
        hidePrompt,
    };
}

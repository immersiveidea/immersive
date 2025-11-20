import React from "react";
import {Button, Text, Title} from "@mantine/core";
import {IconBadgeVr, IconBrandMeta, IconHeadset} from "@tabler/icons-react";
import log from "loglevel";

const logger = log.getLogger('VREntryPrompt');

interface VREntryPromptProps {
    isVisible: boolean;
    onEnterVR: () => void;
    onSkip: () => void;
}

export default function VREntryPrompt({ isVisible, onEnterVR, onSkip }: VREntryPromptProps) {
    if (!isVisible) {
        return null;
    }

    logger.info('VR entry prompt is rendering');

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            zIndex: 10000,
            pointerEvents: 'auto'
        }}>
            <IconBrandMeta size={80} color="white" />
            <Title order={1} c="white" ta="center">Ready to Enter VR</Title>
            <Text
                size="xl"
                c="white"
                ta="center"
                style={{maxWidth: '600px', padding: '0 2rem', color: 'white'}}
            >
                Tap the button below to enter immersive mode and explore the diagram in VR
            </Text>
            <Button
                size="xl"
                onClick={(e) => {
                    e.preventDefault();
                    logger.info('User tapped VR entry button');
                    onEnterVR();
                }}

            >
                Enter <IconBadgeVr size={80} color="black" /> Now
            </Button>
            <Button
                variant="subtle"
                onClick={(e) => {
                    e.preventDefault();
                    logger.info('User skipped VR entry');
                    onSkip();
                }}
                style={{color: 'white', fontSize: '1rem'}}
            >
                Skip - Stay in Desktop Mode
            </Button>
        </div>
    );
}

import {Button, Card, Container, Group, Stack, Text, Title, Alert, Box, List, ThemeIcon} from "@mantine/core";
import PageTemplate from "../pageTemplate";
import {useEffect, useState} from "react";
import {getDeviceCapabilities, DeviceCapabilities} from "../../util/deviceDetection";
import {IconHeadset, IconCheck, IconRocket} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";

export default function About() {
    const [deviceCaps, setDeviceCaps] = useState<DeviceCapabilities | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getDeviceCapabilities().then(setDeviceCaps);
    }, []);

    const handleTryItOut = () => {
        // For Quest users, set a flag indicating intent to enter VR
        // This allows the demo page to show immediate VR entry UI
        if (deviceCaps?.isMobileVR) {
            sessionStorage.setItem('autoEnterVR', 'true');
        }

        // Use React Router navigation instead of window.location to try preserving gesture context
        navigate('/db/public/demo');
    };

    const getCtaText = () => {
        if (!deviceCaps) return "Try It Now";
        if (deviceCaps.isMobileVR) return "Launch VR Experience";
        if (deviceCaps.isVRCapable) return "Try It Now (VR Ready)";
        return "Try It Now (Desktop Mode)";
    };

    return (
        <PageTemplate>
            <Container size="lg" py={60}>
                {/* Hero Section */}
                <Stack gap="xl" mb={60}>
                    <Title order={1} ta="center" size="3rem">
                        3D Diagramming in Virtual Reality
                    </Title>
                    <Text size="xl" ta="center" c="dimmed" maw={800} mx="auto">
                        Das Fad is a groundbreaking WebXR platform for creating, collaborating, and exploring
                        system architecture diagrams in immersive 3D space.
                    </Text>

                    <Group justify="center" mt="md">
                        <Button
                            size="xl"
                            onClick={handleTryItOut}
                            leftSection={<IconRocket size={24} />}
                        >
                            {getCtaText()}
                        </Button>
                    </Group>

                    {/* VR Headset Recommendation */}
                    {deviceCaps && !deviceCaps.isMobileVR && (
                        <Alert
                            variant="light"
                            color="blue"
                            title="Best Experienced in VR"
                            icon={<IconHeadset />}
                            maw={700}
                            mx="auto"
                        >
                            While you can use Das Fad on desktop, the experience truly shines with a VR headset like
                            Meta Quest 2/3. In VR, you can naturally walk around your diagrams, manipulate objects
                            with your hands, and experience spatial relationships at full scale.
                        </Alert>
                    )}

                    {deviceCaps && deviceCaps.isMobileVR && (
                        <Alert
                            variant="light"
                            color="green"
                            title="VR Headset Detected!"
                            icon={<IconHeadset />}
                            maw={700}
                            mx="auto"
                        >
                            Perfect! You're using a VR headset - you'll get the full immersive experience.
                            Tap the button above to launch directly into VR.
                        </Alert>
                    )}
                </Stack>

                {/* Feature Highlights */}
                <Stack gap="lg" mb={60}>
                    <Title order={2} ta="center" mb="md">
                        Why Das Fad?
                    </Title>

                    <Box>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group mb="xs">
                                <ThemeIcon size="lg" radius="md" variant="light">
                                    <IconCheck size={20} />
                                </ThemeIcon>
                                <Title order={3}>Immersive 3D Diagramming</Title>
                            </Group>
                            <Text c="dimmed">
                                Create and manipulate diagrams in true 3D space. Walk around your architecture,
                                see spatial relationships, and design at room scale.
                            </Text>
                        </Card>
                    </Box>

                    <Box>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group mb="xs">
                                <ThemeIcon size="lg" radius="md" variant="light">
                                    <IconCheck size={20} />
                                </ThemeIcon>
                                <Title order={3}>Real-Time Collaboration</Title>
                            </Group>
                            <Text c="dimmed">
                                Meet your team in VR. See their avatars, watch changes happen in real-time,
                                and collaborate naturally in shared 3D space.
                            </Text>
                        </Card>
                    </Box>

                    <Box>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group mb="xs">
                                <ThemeIcon size="lg" radius="md" variant="light">
                                    <IconCheck size={20} />
                                </ThemeIcon>
                                <Title order={3}>Built for Professionals</Title>
                            </Group>
                            <Text c="dimmed">
                                Designed by software professionals for architects, security teams, developers,
                                and risk management. Audit trails, encryption, and forensic analysis built-in.
                            </Text>
                        </Card>
                    </Box>

                    <Box>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group mb="xs">
                                <ThemeIcon size="lg" radius="md" variant="light">
                                    <IconCheck size={20} />
                                </ThemeIcon>
                                <Title order={3}>Works Everywhere</Title>
                            </Group>
                            <Text c="dimmed">
                                Desktop browser or VR headset - your choice. Start on desktop, continue in VR.
                                Your diagrams sync seamlessly across devices.
                            </Text>
                        </Card>
                    </Box>
                </Stack>

                {/* VR Benefits Section */}
                <Card shadow="md" padding="xl" radius="md" bg="dark.7" mb={60}>
                    <Title order={2} mb="md" c="white">
                        Why VR Makes a Difference
                    </Title>
                    <List
                        spacing="md"
                        size="md"
                        icon={
                            <ThemeIcon color="blue" size={24} radius="xl">
                                <IconCheck size={16} />
                            </ThemeIcon>
                        }
                    >
                        <List.Item>
                            <Text c="white">
                                <strong>Spatial Understanding:</strong> Grasp complex system relationships by
                                physically walking around your architecture
                            </Text>
                        </List.Item>
                        <List.Item>
                            <Text c="white">
                                <strong>Natural Interaction:</strong> Use your hands to create, move, and
                                connect components - no learning curve
                            </Text>
                        </List.Item>
                        <List.Item>
                            <Text c="white">
                                <strong>True Scale:</strong> See your systems at real-world scale, from
                                microservices to global networks
                            </Text>
                        </List.Item>
                        <List.Item>
                            <Text c="white">
                                <strong>Immersive Focus:</strong> No distractions, no screen switching -
                                just you and your architecture
                            </Text>
                        </List.Item>
                        <List.Item>
                            <Text c="white">
                                <strong>Better Collaboration:</strong> Meet teammates as avatars, point at
                                things naturally, and communicate intuitively
                            </Text>
                        </List.Item>
                    </List>
                </Card>

                {/* CTA Section */}
                <Stack gap="md" align="center">
                    <Title order={2}>Ready to Try It?</Title>
                    <Text size="lg" c="dimmed" ta="center" maw={600}>
                        No signup required to start exploring. Create your first diagram in seconds.
                    </Text>
                    <Button
                        size="xl"
                        onClick={handleTryItOut}
                        leftSection={<IconRocket size={24} />}
                    >
                        {getCtaText()}
                    </Button>
                    <Text size="sm" c="dimmed" ta="center">
                        Guest mode uses local storage only. Sign up to sync across devices and collaborate with teams.
                    </Text>
                </Stack>
            </Container>
        </PageTemplate>
    );
}
import VrApp from '../../vrApp';
import React, {useEffect, useState} from "react";
import {Affix, Burger, Group, Menu, Alert, Button, Text} from "@mantine/core";
import VrTemplate from "../vrTemplate";
import {IconStar, IconInfoCircle} from "@tabler/icons-react";
import VrMenuItem from "../components/vrMenuItem";
import CreateDiagramModal from "./createDiagramModal";
import ManageDiagramsModal from "./manageDiagramsModal";
import {useNavigate, useParams} from "react-router-dom";
import {useDisclosure} from "@mantine/hooks";
import ConfigModal from "./configModal";
import log from "loglevel";
import {useIsFeatureEnabled, useUserTier} from "../hooks/useFeatures";
import {useAuth0} from "@auth0/auth0-react";
import {GUEST_MODE_BANNER} from "../../content/upgradeCopy";
import {exportDiagramAsJSON} from "../../util/functions/exportDiagramAsJSON";
import {isMobileVRDevice} from "../../util/deviceDetection";
import {DefaultScene} from "../../defaultScene";
import VREntryPrompt from "../components/VREntryPrompt";

let vrApp: VrApp = null;

const defaultCreate = window.localStorage.getItem('createOpened') === 'true';
const defaultConfig = window.localStorage.getItem('configOpened') === 'true';
const defaultManage = window.localStorage.getItem('manageOpened') === 'true';
export default function VrExperience() {
    const logger = log.getLogger('vrExperience');
    const params = useParams();
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);

    // Feature flags
    const createDiagramEnabled = useIsFeatureEnabled('createDiagram');
    const createFromTemplateEnabled = useIsFeatureEnabled('createFromTemplate');
    const manageDiagramsEnabled = useIsFeatureEnabled('manageDiagrams');
    const shareCollaborateEnabled = useIsFeatureEnabled('shareCollaborate');
    const editDataEnabled = useIsFeatureEnabled('editData');
    const configEnabled = useIsFeatureEnabled('config');
    const enterImmersiveEnabled = useIsFeatureEnabled('enterImmersive');
    const launchMetaQuestEnabled = useIsFeatureEnabled('launchMetaQuest');
    const userTier = useUserTier();

    const handleSignUp = () => {
        loginWithRedirect({
            appState: { returnTo: window.location.pathname }
        });
    };

    const handleExportJSON = async () => {
        try {
            await exportDiagramAsJSON(dbName);
            logger.info('Diagram exported successfully');
        } catch (error) {
            logger.error('Failed to export diagram:', error);
        }
    };

    const saveState = (key, value) => {
        logger.debug('saving', key, value)
        window.localStorage.setItem(key, value ? 'true' : 'false');
    }
    const [createOpened, {open: openCreate, close: closeCreate}] =
        useDisclosure(defaultCreate,
            {
                onOpen: () => {
                    saveState('createOpened', true)
                }, onClose: () => {
                    saveState('createOpened', false)
                }
            });
    const [manageOpened, {open: openManage, close: closeManage}] = useDisclosure(
        defaultManage,
        {
            onOpen: () => {
                saveState('manageOpened', true)
            }, onClose: () => {
                saveState('manageOpened', false)
            }
        })
    const [configOpened, {open: openConfig, close: closeConfig}] =
        useDisclosure(
            defaultConfig,
            {
                onOpen: () => {
                    saveState('configOpened', true)
                }, onClose: () => {
                    saveState('configOpened', false)
                }
            })

    const [rerender, setRerender] = useState(0);
    const [dbName, setDbName] = useState(params.db);
    const [showVRPrompt, setShowVRPrompt] = useState(false);

    useEffect(() => {
        const canvas = document.getElementById('vrCanvas');
        if (!canvas) {
            logger.error('no canvas');
            return;
        }
        if (vrApp) {
            logger.debug('destroying vrApp');
            vrApp.dispose();
        }
        vrApp = new VrApp(canvas as HTMLCanvasElement, dbName);
        closeManage();

        // Show VR entry prompt for all Quest users navigating to any /db/** path
        const isQuest = isMobileVRDevice();
        logger.info(`Device check: isMobileVRDevice=${isQuest}, userAgent=${navigator.userAgent}`);

        if (isQuest) {
            logger.info('Quest device detected, will show VR prompt when ready');

            // Wait for XR to be ready, then show the prompt
            let attempts = 0;
            const maxAttempts = 50;

            const waitForXRReady = setInterval(() => {
                attempts++;
                const scene = DefaultScene.Scene;
                const groundMesh = scene?.getMeshByName('ground');

                logger.debug(`XR readiness check attempt ${attempts}: scene=${!!scene}, groundMesh=${!!groundMesh}`);

                if (groundMesh || attempts >= maxAttempts) {
                    clearInterval(waitForXRReady);
                    if (groundMesh) {
                        logger.info('XR ready, showing VR entry prompt');
                        setShowVRPrompt(true);
                        logger.info(`showVRPrompt state set to true`);
                    } else {
                        logger.warn('XR setup timeout, cannot show VR prompt');
                    }
                }
            }, 500);
        }
    }, [dbName]);

    const [immersiveDisabled, setImmersiveDisabled] = useState(true);
    const navigate = useNavigate();

    // Tier indicator functions - now using the actual user tier
    const getTierIndicator = (requiredTier: 'free' | 'basic' | 'pro') => {
        if (requiredTier === 'free' || userTier === requiredTier ||
            (userTier === 'pro' && (requiredTier === 'basic' || requiredTier === 'free')) ||
            (userTier === 'basic' && requiredTier === 'free')) {
            return null; // User has access, no indicator needed
        }

        // Show tier requirement
        if (requiredTier === 'basic') {
            return <Group w={50}>Basic</Group>;
        }
        if (requiredTier === 'pro') {
            return <Group w={50}>Pro!<IconStar size={11}/></Group>;
        }
        return null;
    }

    const enterImmersive = (e) => {
        logger.info('entering immersive mode');
        e.preventDefault();
        const event = new CustomEvent('enterXr', {bubbles: true});
        window.dispatchEvent(event);
    }
    const createModal = () => {
        if (createOpened) {
            return <CreateDiagramModal createOpened={createOpened} closeCreate={closeCreate}/>
        } else {
            return <></>
        }
    }
    const manageModal = () => {
        if (manageOpened) {
            return <ManageDiagramsModal openCreate={openCreate}
                                        manageOpened={manageOpened}
                                        closeManage={closeManage}
            />
        } else {
            return <></>
        }
    }

    return (
        <React.StrictMode>
        <VrTemplate>
            {/* Guest Mode Banner - Non-aggressive, dismissible (hidden for demo) */}
            {!isAuthenticated && !guestBannerDismissed && dbName !== 'demo' && (
                <Affix position={{top: 20, right: 20}} style={{maxWidth: 400}}>
                    <Alert
                        variant="light"
                        color="blue"
                        title={GUEST_MODE_BANNER.title}
                        icon={<IconInfoCircle size={20} />}
                        withCloseButton
                        onClose={() => setGuestBannerDismissed(true)}
                    >
                        <Text size="sm" mb="xs">
                            {GUEST_MODE_BANNER.message}
                        </Text>
                        <Button
                            size="xs"
                            onClick={handleSignUp}
                            variant="light"
                        >
                            {GUEST_MODE_BANNER.ctaText}
                        </Button>
                    </Alert>
                </Affix>
            )}

            <ConfigModal closeConfig={closeConfig} configOpened={configOpened}/>
            {createModal()}
            {manageModal()}
            <Affix position={{top: 30, left: 60}}>
                <Menu trigger="hover" openDelay={50} closeDelay={400}>
                    <Menu.Target>
                        <Burger size="xl"/>
                    </Menu.Target>
                    <Menu.Dropdown>
                        {/* Home is always visible */}
                        <VrMenuItem
                            tip={"Exit modeling environment and go back to main site"}
                            onClick={() => {
                                navigate("/")
                            }}
                            label="Home"
                            availableIcon={null}/>

                        {enterImmersiveEnabled && (
                            <VrMenuItem
                                tip={immersiveDisabled ? "Browser does not support WebXR. Immersive experience best viewed with Meta Quest headset" : "Enter Immersive Mode"}
                                onClick={enterImmersive}
                                label="Enter Immersive Mode"
                                availableIcon={getTierIndicator('free')}/>
                        )}

                        {launchMetaQuestEnabled && (
                            <VrMenuItem
                                tip="Open a new window and automatically send experience to your Meta Quest headset"
                                onClick={() => {
                                    window.open('https://www.oculus.com/open_url/?url=' + window.location.href, 'launchQuest', 'popup')
                                }}
                                label="Launch On Meta Quest"
                                availableIcon={getTierIndicator('free')}/>
                        )}

                        {editDataEnabled && (
                            <>
                                <Menu.Divider/>
                                <VrMenuItem
                                    tip="Edit data on desktop (Best for large amounts of text or images).  After adding data, you can enter immersive mode to further refine the model."
                                    label="Edit Data"
                                    onClick={null}
                                    availableIcon={getTierIndicator('free')}/>
                            </>
                        )}

                        {(createDiagramEnabled || createFromTemplateEnabled || manageDiagramsEnabled) && <Menu.Divider/>}

                        {createDiagramEnabled && (
                            <VrMenuItem
                                tip="Create a new diagram from scratch"
                                label="Create"
                                onClick={openCreate}
                                availableIcon={getTierIndicator('free')}/>
                        )}

                        {createFromTemplateEnabled && (
                            <VrMenuItem
                                tip="Create a new diagram from predefined template"
                                label="Create From Template"
                                onClick={null}
                                availableIcon={getTierIndicator('basic')}/>
                        )}

                        {manageDiagramsEnabled && (
                            <VrMenuItem
                                tip="Manage Diagrams"
                                label="Manage"
                                onClick={openManage}
                                availableIcon={getTierIndicator('free')}/>
                        )}

                        {/* Export JSON - Always available for creating templates */}
                        <VrMenuItem
                            tip="Export current diagram as JSON file (useful for creating templates)"
                            label="Export JSON"
                            onClick={handleExportJSON}
                            availableIcon={null}/>

                        {(shareCollaborateEnabled || configEnabled) && <Menu.Divider/>}

                        {shareCollaborateEnabled && (
                            <VrMenuItem
                                tip="Share your model with others and collaborate in real time with others.  This is a paid feature."
                                label="Share"
                                onClick={null}
                                availableIcon={getTierIndicator('pro')}/>
                        )}

                        {configEnabled && (
                            <VrMenuItem
                                tip="Configure settings for your VR experience"
                                label="Config"
                                onClick={openConfig}
                                availableIcon={getTierIndicator('free')}/>
                        )}
                    </Menu.Dropdown>
                </Menu>
            </Affix>
            <canvas id="vrCanvas" style={{zIndex: 1000, width: '100%', height: '100vh'}}/>

            {/* VR Entry Prompt - Rendered AFTER canvas to ensure it's on top in DOM order */}
            <VREntryPrompt
                isVisible={showVRPrompt}
                onEnterVR={() => {
                    setShowVRPrompt(false);
                    const event = new CustomEvent('enterXr', {bubbles: true});
                    window.dispatchEvent(event);
                }}
                onSkip={() => setShowVRPrompt(false)}
            />
        </VrTemplate>
        </React.StrictMode>
    )
}
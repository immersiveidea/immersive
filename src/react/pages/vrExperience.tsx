import VrApp from '../../vrApp';
import React, {useEffect, useState} from "react";
import {Affix, Burger, Group, Menu} from "@mantine/core";
import VrTemplate from "../vrTemplate";
import {IconStar} from "@tabler/icons-react";
import VrMenuItem from "../components/vrMenuItem";
import CreateDiagramModal from "./createDiagramModal";
import ManageDiagramsModal from "./manageDiagramsModal";
import {useNavigate, useParams} from "react-router-dom";
import {useDisclosure} from "@mantine/hooks";
import ConfigModal from "./configModal";
import FirstVisitVr from "../instructions/firstVisitVr";
import log from "loglevel";

let vrApp: VrApp = null;

const defaultCreate = window.localStorage.getItem('createOpened') === 'true';
const defaultConfig = window.localStorage.getItem('configOpened') === 'true';
const defaultManage = window.localStorage.getItem('manageOpened') === 'true';
export default function VrExperience() {
    const logger = log.getLogger('vrExperience');
    const params = useParams();
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
    }, [dbName]);

    const [immersiveDisabled, setImmersiveDisabled] = useState(true);
    const navigate = useNavigate();

    const availableInFree = () => {
        return null;
    }
    const availableInBasic = () => {
        return <Group w={50}>Basic</Group>
    }
    const availableInPro = () => {
        return <Group w={50}>Pro!<IconStar size={11}/></Group>
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
            <FirstVisitVr/>
            <ConfigModal closeConfig={closeConfig} configOpened={configOpened}/>
            {createModal()}
            {manageModal()}
            <Affix position={{top: 30, left: 60}}>
                <Menu trigger="hover" openDelay={50} closeDelay={400}>
                    <Menu.Target>
                        <Burger size="xl"/>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <VrMenuItem
                            tip={"Exit modeling environment and go back to main site"}
                            onClick={() => {
                                navigate("/")
                            }}
                            label="Home"
                            availableIcon={availableInFree()}/>
                        <VrMenuItem
                            tip={immersiveDisabled ? "Browser does not support WebXR. Immersive experience best viewed with Meta Quest headset" : "Enter Immersive Mode"}
                            onClick={enterImmersive}
                            label="Enter Immersive Mode"
                            availableIcon={availableInFree()}/>
                        <VrMenuItem
                            tip="Open a new window and automatically send experience to your Meta Quest headset"
                            onClick={() => {
                                window.open('https://www.oculus.com/open_url/?url=' + window.location.href, 'launchQuest', 'popup')
                            }}
                            label="Launch On Meta Quest"
                            availableIcon={availableInFree()}/>
                        <Menu.Divider/>
                        <VrMenuItem
                            tip="Edit data on desktop (Best for large amounts of text or images).  After adding data, you can enter immersive mode to further refine the model."
                            label="Edit Data"
                            onClick={null}
                            availableIcon={availableInFree()}/>
                        <Menu.Divider/>
                        <VrMenuItem
                            tip="Create a new diagram from scratch"
                            label="Create"
                            onClick={openCreate}
                            availableIcon={availableInFree()}/>
                        <VrMenuItem
                            tip="Create a new diagram from predefined template"
                            label="Create From Template"
                            onClick={null}
                            availableIcon={availableInBasic()}/>
                        <VrMenuItem
                            tip="Manage Diagrams"
                            label="Manage"
                            onClick={openManage}
                            availableIcon={availableInFree()}/>
                        <Menu.Divider/>
                        <VrMenuItem
                            tip="Share your model with others and collaborate in real time with others.  This is a paid feature."
                            label="Share"
                            onClick={null}
                            availableIcon={availableInPro()}/>
                        <VrMenuItem
                            tip="Configure settings for your VR experience"
                            label="Config"
                            onClick={openConfig}
                            availableIcon={availableInFree()}/>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
            <canvas id="vrCanvas" style={{zIndex: 1000, width: '100%', height: '100vh'}}/>
        </VrTemplate>
        </React.StrictMode>
    )
}
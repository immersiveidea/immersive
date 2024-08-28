//import VrApp from '../../vrApp';
import React, {useEffect, useState} from "react";
import {Affix, Burger, Group, Menu} from "@mantine/core";
import VrTemplate from "../vrTemplate";
import {IconStar} from "@tabler/icons-react";
import VrMenuItem from "../components/vrMenuItem";
import CreateDiagramModal from "./createDiagramModal";
import ManageDiagramsModal from "./manageDiagramsModal";
import {useNavigate} from "react-router-dom";
import {useDisclosure} from "@mantine/hooks";

export default function VrExperience() {
    const [createOpened, {open: openCreate, close: closeCreate}] = useDisclosure(false);
    const [manageOpened, {open: openManage, close: closeManage}] = useDisclosure(false);
    useEffect(() => {
        const data = window.localStorage.getItem('createOpened');
        if (data === 'true') {
            openCreate();
        }
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            setImmersiveDisabled(!supported);
        });
    }, []);
    useEffect(() => {
        console.log('Create Opened: ', createOpened);
        window.localStorage.setItem('createOpened', createOpened ? 'true' : 'false');
    }, [createOpened])

    const [immersiveDisabled, setImmersiveDisabled] = useState(true);
    const navigate = useNavigate();

    const availableInFree = () => {
        return null
    }
    const availableInBasic = () => {
        return <Group w={50}>Basic</Group>
    }
    const availableInPro = () => {
        return <Group w={50}>Pro!<IconStar size={11}/></Group>
    }

    const enterImmersive = (e) => {
        console.log('entering immersive mode');
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
                                        manageOpened={manageOpened} closeManage={closeManage}/>
        } else {
            return <></>
        }
    }
    console.log('VrExperience');
    return (
        <React.StrictMode>
        <VrTemplate>
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
                    </Menu.Dropdown>
                </Menu>
            </Affix>
            <canvas id="gameCanvas" style={{width: '100%', height: '100vh'}}/>


        </VrTemplate>
        </React.StrictMode>
    )
}
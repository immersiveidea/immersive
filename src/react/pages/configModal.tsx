import {Group, Modal, SegmentedControl, Stack, Switch} from "@mantine/core";
import {useEffect, useState} from "react";
import {setAppConfig} from "../../util/appConfig";

const locationSnaps = [
    {value: ".01", label: '1cm'},
    {value: ".05", label: '5cm'},
    {value: ".1", label: '10cm'},
    {value: ".5", label: '50cm'},
    {value: "1", label: '1m'},
]
const rotationSnaps = [
    {value: "22.5", label: '22.5°'},
    {value: "45", label: '45°'},
    {value: "90", label: '90°'},
    {value: "180", label: '180°'},
    {value: "360", label: '360°'},
]
let defaultConfig =
    {
        locationSnap: '.1',
        locationSnapEnabled: true,
        rotationSnap: '90',
        rotationSnapEnabled: true,
        flyModeEnabled: true,
        snapTurnSnap: '45',
        snapTurnSnapEnabled: false
    }
try {
    const newConfig = JSON.parse(localStorage.getItem('config'));
    defaultConfig = {...defaultConfig, ...newConfig};
    console.log(defaultConfig);
} catch (e) {

}

export default function ConfigModal({configOpened, closeConfig}) {
    const [locationSnap, setLocationSnap] = useState(defaultConfig.locationSnap);
    const [locationSnapEnabled, setLocationSnapEnabled] = useState(defaultConfig.locationSnapEnabled);
    const [snapTurnSnap, setSnapTurnSnap] = useState(defaultConfig.snapTurnSnap);
    const [snapTurnSnapEnabled, setSnapTurnSnapEnabled] = useState(defaultConfig.snapTurnSnapEnabled);
    const [rotationSnap, setRotationSnap] = useState(defaultConfig.rotationSnap);
    const [rotationSnapEnabled, setRotationSnapEnabled] = useState(defaultConfig.rotationSnapEnabled);
    const [flyModeEnabled, setFlyModeEnabled] = useState(defaultConfig.flyModeEnabled);
    useEffect(() => {
        const config = {
            locationSnap: locationSnap,
            locationSnapEnabled: locationSnapEnabled,
            rotationSnap: rotationSnap,
            rotationSnapEnabled: rotationSnapEnabled,
            snapTurnSnap: snapTurnSnap,
            snapTurnSnapEnabled: snapTurnSnapEnabled,
            flyModeEnabled: flyModeEnabled
        }
        setAppConfig(config);

    }, [locationSnap, locationSnapEnabled, rotationSnap, rotationSnapEnabled, snapTurnSnap, snapTurnSnapEnabled, flyModeEnabled]);
    return (
        <Modal onClose={closeConfig} opened={configOpened}>
            <h1>Configuration</h1>
            <Stack>


                <Group key="location">
                    <label key="label">Location Snap</label>
                    <Switch w={128} label={locationSnapEnabled ? 'Enabled' : 'Disabled'} key="switch"
                            checked={locationSnapEnabled} onChange={(e) => {
                        setLocationSnapEnabled(e.currentTarget.checked)
                    }}/>
                    <SegmentedControl disabled={!locationSnapEnabled} key='stepper' data={locationSnaps}
                                      value={locationSnap}
                                      color={locationSnapEnabled ? "myColor" : "gray.9"}
                                      onChange={setLocationSnap}/>

                </Group>

                <Group key="rotation">
                    <label key="label">Rotation Snap</label>
                    <Switch w={128} label={rotationSnapEnabled ? 'Enabled' : 'Disabled'} key="switch"

                            checked={rotationSnapEnabled} onChange={(e) => {
                        setRotationSnapEnabled(e.currentTarget.checked)
                    }}/>
                    <SegmentedControl key='stepper'
                                      data={rotationSnaps}
                                      color={rotationSnapEnabled ? "myColor" : "gray.9"}
                                      value={rotationSnap}
                                      onChange={setRotationSnap}/>
                </Group>
                <Switch w={256} label={flyModeEnabled ? 'Fly Mode Enabled' : 'Fly Mode Disabled'} key="switch"
                        checked={flyModeEnabled} onChange={(e) => {
                    setFlyModeEnabled(e.currentTarget.checked)
                }}/>
                <Group key="snapturn">
                    <label key="label">Snap Turn</label>
                    <Switch w={128} label={snapTurnSnapEnabled ? 'Enabled' : 'Disabled'} key="switch"

                            checked={snapTurnSnapEnabled} onChange={(e) => {
                        setSnapTurnSnapEnabled(e.currentTarget.checked)
                    }}/>
                    <SegmentedControl key='stepper'
                                      data={rotationSnaps}
                                      color={snapTurnSnapEnabled ? "myColor" : "gray.9"}
                                      value={snapTurnSnap}
                                      onChange={setSnapTurnSnap}/>
                </Group>
            </Stack>
        </Modal>
    )

}
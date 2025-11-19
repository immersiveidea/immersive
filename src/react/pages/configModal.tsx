import {Group, Modal, SegmentedControl, Stack, Switch, Select} from "@mantine/core";
import {useEffect, useState} from "react";
import {AppConfig, appConfigInstance} from "../../util/appConfig";
import {LabelRenderingMode} from "../../util/appConfigType";

const locationSnaps = [
    {value: "0.01", label: '1cm'},
    {value: "0.05", label: '5cm'},
    {value: "0.1", label: '10cm'},
    {value: "0.5", label: '50cm'},
    {value: "1", label: '1m'},
]
const rotationSnaps = [
    {value: "22.5", label: '22.5°'},
    {value: "45", label: '45°'},
    {value: "90", label: '90°'},
    {value: "180", label: '180°'},
    {value: "360", label: '360°'},
]
const labelRenderingModes = [
    {value: 'fixed', label: 'Fixed'},
    {value: 'billboard', label: 'Billboard (Always Face Camera)'},
    {value: 'dynamic', label: 'Dynamic (Coming Soon)', disabled: true},
    {value: 'distance', label: 'Distance-based (Coming Soon)', disabled: true},
]
export default function ConfigModal({configOpened, closeConfig}) {
    // Get current config values when component mounts/renders
    const currentConfig = appConfigInstance.current;

    const [locationSnap, setLocationSnap] = useState(currentConfig.locationSnap);
    const [locationSnapEnabled, setLocationSnapEnabled] = useState(currentConfig.locationSnap > 0);
    const [snapTurnSnap, setSnapTurnSnap] = useState(currentConfig.turnSnap);
    const [snapTurnSnapEnabled, setSnapTurnSnapEnabled] = useState(currentConfig.turnSnap > 0);
    const [rotationSnap, setRotationSnap] = useState(currentConfig.rotateSnap);
    const [rotationSnapEnabled, setRotationSnapEnabled] = useState(currentConfig.rotateSnap > 0);
    const [flyModeEnabled, setFlyModeEnabled] = useState(currentConfig.flyMode);
    const [labelRenderingMode, setLabelRenderingMode] = useState<LabelRenderingMode>(currentConfig.labelRenderingMode);

    // Update individual config properties when they change
    useEffect(() => {
        appConfigInstance.setGridSnap(locationSnapEnabled ? locationSnap : 0);
    }, [locationSnap, locationSnapEnabled]);

    useEffect(() => {
        appConfigInstance.setRotateSnap(rotationSnapEnabled ? rotationSnap : 0);
    }, [rotationSnap, rotationSnapEnabled]);

    useEffect(() => {
        appConfigInstance.setTurnSnap(snapTurnSnapEnabled ? snapTurnSnap : 0);
    }, [snapTurnSnap, snapTurnSnapEnabled]);

    useEffect(() => {
        appConfigInstance.setFlyMode(flyModeEnabled);
    }, [flyModeEnabled]);

    useEffect(() => {
        appConfigInstance.setLabelRenderingMode(labelRenderingMode);
    }, [labelRenderingMode]);
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
                                      value={String(locationSnap)}
                                      color={locationSnapEnabled ? "myColor" : "gray.9"}
                                      onChange={(value) => setLocationSnap(parseFloat(value))}/>

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
                                      value={String(rotationSnap)}
                                      onChange={(value) => setRotationSnap(parseFloat(value))}/>
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
                                      value={String(snapTurnSnap)}
                                      onChange={(value) => setSnapTurnSnap(parseFloat(value))}/>
                </Group>
                <Group key="labelmode">
                    <label key="label">Label Rendering Mode</label>
                    <Select
                        w={300}
                        key="select"
                        data={labelRenderingModes}
                        value={labelRenderingMode}
                        onChange={(value) => setLabelRenderingMode(value as LabelRenderingMode)}
                    />
                </Group>
            </Stack>
        </Modal>
    )

}
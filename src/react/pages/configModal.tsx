import {Group, Modal, NumberInput, SegmentedControl, Slider, Switch} from "@mantine/core";
import {useState} from "react";

const locationSnaps = [
    {value: ".01", label: '1cm'},
    {value: ".05", label: '5cm'},
    {value: ".1", label: '10cm'},
    {value: ".5", label: '50cm'},
    {value: "1", label: '1m'},
]

export default function ConfigModal({configOpened, closeConfig}) {
    const [locationSnap, setLocationSnap] = useState(.1);
    const [locationSnapEnabled, setLocationSnapEnabled] = useState(true);
    return (
        <Modal onClose={closeConfig} opened={configOpened}>
            <h1>Configuration</h1>
            <Group>
                <label>Location Snap</label>
                <Switch checked={locationSnapEnabled} onChange={(e) => {
                    setLocationSnapEnabled(e.currentTarget.checked)
                }}/>
                <SegmentedControl key='stepper' data={locationSnaps} color='blue' value={locationSnap.toFixed(2)}
                                  onChange={(e) => {
                                      setLocationSnap(parseFloat(e));
                                  }}/>
                <NumberInput hideControls allowNegative={false} key='value'
                             w={64} step={.01} value={locationSnap.toFixed(2)} decimalScale={2} min={.01} max={1}

                />
            </Group>

            <Slider defaultValue={.1} label='Object Rotation Snap' max={1} min={.01}/>
        </Modal>
    )

}
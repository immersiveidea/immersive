import {Indicator, Menu, Tooltip} from "@mantine/core";
import {useState} from "react";

export default function VrMenuItem({availableIcon, tip, label, onClick}) {
    const [processing, setProcessing] = useState(true);
    window.setTimeout(() => {
        setProcessing(false);
    }, 2000)
    if (availableIcon) {
        return (<Tooltip multiline={true} w={256}
                         label={tip} position="right">
            <Indicator size={25} radius="lg" offset={-15} processing={processing} position="middle-end"
                       label={availableIcon}>
                <Menu.Item
                    onClick={onClick || null}>
                    {label}</Menu.Item>
            </Indicator>
        </Tooltip>)
    } else {
        return (
            <Tooltip multiline={true} w={256}
                     label={tip} position="right">
                <Menu.Item
                    onClick={onClick || null}>
                    {label}</Menu.Item>
            </Tooltip>)
    }

}
import React from "react";
import {Modal} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";

const firstVisit = !(window.localStorage.getItem('firstVisit') === 'false');
export default function FirstVisitVr() {
    const [opened, {close}] =
        useDisclosure(firstVisit,
            {
                onClose: () => {
                    window.localStorage.setItem('firstVisit', 'false')
                }
            });
    return (
        <Modal opened={opened} onClose={close}>
            Welcome
        </Modal>
    )
}
import {Button, Card, Modal, Paper, SimpleGrid, Stack} from "@mantine/core";
import React from "react";

export default function ManageDiagramsModal({manageOpened, setManageOpened}) {
    const diagrams = [
        {name: "Diagram 1", description: "Description 1"},
        {name: "Diagram 1", description: "Description 1"},
        {name: "Diagram 1", description: "Description 1"},
        {name: "Diagram 1", description: "Description 1"},
        {name: "Diagram 1", description: "Description 1"},
        {name: "Diagram 1", description: "Description 1"},
    ]

    const cards = diagrams.map((diagram) => {
        return (<Card><h1>{diagram.name}</h1></Card>)
    });

    const buildCreateButton = () => {
        if (diagrams.length < 6) {
            return <Button size="lg" disabled={false}>Create</Button>
        } else {
            return (<Stack>
                <Button size="lg" disabled={true}>Create</Button>
                <Paper>You've reached the max number of diagrams for this Tier.</Paper>
                <Button size="xl">Upgrade To Pro</Button>
            </Stack>)
        }
    }

    return (
        <Modal opened={manageOpened} size="lg" onClose={() => {
            setManageOpened(false)
        }}>
            <h1>Select a Diagram</h1>
            <SimpleGrid cols={3}>
                {cards}
            </SimpleGrid>
            {buildCreateButton()}
        </Modal>

    )
}
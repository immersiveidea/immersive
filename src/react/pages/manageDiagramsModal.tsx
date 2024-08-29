import {Button, Card, Container, Group, Modal, Paper, SimpleGrid, Stack} from "@mantine/core";
import React from "react";
import {useDoc, usePouch} from "use-pouchdb";
import {IconTrash} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import log from "loglevel";

export default function ManageDiagramsModal({openCreate, manageOpened, closeManage}) {
    const logger = log.getLogger('manageDiagramsModal');
    const {doc: diagram, error} = useDoc('directory', {}, {_id: 'directory', diagrams: []});
    const db = usePouch();
    if (error) {

        if (error.status === 404) {
            logger.info('Creating new diagram document');
            db.put({_id: 'directory', diagrams: []});
        } else {
            logger.error('Error getting diagram document', error);
        }
        return <></>;
    }
    const diagrams = diagram.diagrams || [];

    const cards = diagrams.map((diagram) => {
        return (
            <Card key={diagram._id}>
                <Card.Section>
                    <Container w={512} h={64}>{diagram.name}</Container>
                </Card.Section>
                <Card.Section>
                    <Container w={512} h={128}>
                        {diagram.description}
                    </Container>
                </Card.Section>
                <Card.Section>
                    <Group justify="space-evenly">
                        <Button component={Link} key="examples" to={"/db/public/" + diagram._id} p={5} c="myColor"
                                bg="none">Select</Button>

                        <Button bg="red" size="xs"><IconTrash size={16}/></Button>
                    </Group>
                </Card.Section>
            </Card>
        )
    });

    const buildCreateButton = () => {
        if (diagrams.length < 6) {
            return <Button size="lg" onClick={openCreate} disabled={false}>Create</Button>
        } else {
            return (<Stack>
                <Button key="create" size="lg" disabled={true}>Create</Button>
                <Paper key="upgrademessage">You've reached the max number of diagrams for this Tier.</Paper>
                <Button key="upgradebutton" size="xl">Upgrade To Pro</Button>
            </Stack>)
        }
    }
    return (
        <Modal opened={manageOpened} size="lg" onClose={closeManage}>
            <h1>Select a Diagram</h1>
            <SimpleGrid cols={3}>
                {cards}
            </SimpleGrid>
            {buildCreateButton()}
        </Modal>

    )
}
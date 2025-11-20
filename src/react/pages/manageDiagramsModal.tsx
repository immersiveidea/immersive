import {Button, Card, Container, Group, Modal, Paper, SimpleGrid, Stack} from "@mantine/core";
import React from "react";
import {useDoc, usePouch} from "use-pouchdb";
import {IconTrash, IconDownload} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import log from "loglevel";
import {useFeatureLimit} from "../hooks/useFeatures";
import {exportDiagramAsJSON} from "../../util/functions/exportDiagramAsJSON";

export default function ManageDiagramsModal({openCreate, manageOpened, closeManage}) {
    const logger = log.getLogger('manageDiagramsModal');
    const {doc: diagram, error} = useDoc('directory', {}, {_id: 'directory', diagrams: []});
    const db = usePouch();
    const maxDiagrams = useFeatureLimit('maxDiagrams');
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

    const handleExportDiagram = async (diagramId: string) => {
        try {
            await exportDiagramAsJSON(diagramId);
            logger.info(`Diagram ${diagramId} exported successfully`);
        } catch (error) {
            logger.error('Failed to export diagram:', error);
        }
    };

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

                        <Button
                            onClick={() => handleExportDiagram(diagram._id)}
                            variant="light"
                            size="xs"
                            title="Export as JSON">
                            <IconDownload size={16}/>
                        </Button>

                        <Button bg="red" size="xs"><IconTrash size={16}/></Button>
                    </Group>
                </Card.Section>
            </Card>
        )
    });

    const buildCreateButton = () => {
        // Check against the configured maxDiagrams limit
        const hasReachedLimit = maxDiagrams > 0 && diagrams.length >= maxDiagrams;

        if (!hasReachedLimit) {
            return <Button size="lg" onClick={openCreate} disabled={false}>Create</Button>
        } else {
            return (<Stack>
                <Button key="create" size="lg" disabled={true}>Create</Button>
                <Paper key="upgrademessage">You've reached the max number of diagrams ({maxDiagrams}) for your current tier.</Paper>
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
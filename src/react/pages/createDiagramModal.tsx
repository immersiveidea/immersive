import {Anchor, Button, Checkbox, Group, Modal, Pill, Stack, Textarea, TextInput} from "@mantine/core";

export default function CreateDiagramModal({createOpened, setCreateOpened}) {

    const createDiagram = () => {
        setCreateOpened(false);
    }

    return (
        <Modal opened={createOpened} onClose={() => {
            setCreateOpened(false)
        }}>
            <Stack>


                <TextInput key="name" label="Name" placeholder="Enter diagram name" required/>
                <Textarea key="description" label="Description" placeholder="Enter diagram description"/>
                <Group>
                    <Checkbox w={250} key="private" label="Private" disabled={true}/>
                    <Pill>Basic</Pill>
                </Group>
                <Group>
                    <Checkbox w={250} key="encrypted" label="Encrypted" disabled={true}/>
                    <Pill>Pro</Pill>
                </Group>
                <Group>
                    <Checkbox w={250} key="invite" label="Invite Collaborators" disabled={true}/>
                    <Pill>Pro</Pill>
                </Group>
                <Group>
                    <Button key="create" onClick={createDiagram}>Create</Button>
                    <Anchor p={5} size="sm" key="cancel" onClick={(e) => {
                        e.preventDefault();
                        setCreateOpened(false)
                    }}>Cancel</Anchor>
                </Group>
            </Stack>

        </Modal>

    )
}
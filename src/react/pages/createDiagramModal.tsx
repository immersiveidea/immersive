import {Anchor, Button, Checkbox, Group, Modal, Pill, Stack, Textarea, TextInput} from "@mantine/core";
import {usePouch} from "use-pouchdb";
import {useState} from "react";
import {v4} from "uuid";

export default function CreateDiagramModal({createOpened, closeCreate}) {
    const db = usePouch();
    const [diagram, setDiagram] = useState({
        name: '',
        description: '',
        private: false,
        encrypted: false,
        invite: false
    });
    const createDiagram = async () => {
        let doc = null;
        try {
            doc = await db.get('directory')
        } catch (err) {
            console.error(err);
        }
        const id = 'diagram-' + v4();
        const newDiagram = {...diagram, _id: id}
        if (!doc) {
            await db.put({_id: 'directory', diagrams: [newDiagram]});
        } else {
            if (doc.diagrams) {
                doc.diagrams.push(newDiagram);
            } else {
                doc.diagrams = [newDiagram];
            }
            console.log(doc);
            await db.put(doc);
        }
        closeCreate();
    }

    return (
        <Modal opened={createOpened} onClose={closeCreate}>
            <Stack>
                <TextInput key="name"
                           label="Name"
                           placeholder="Enter diagram name"
                           value={diagram.name}
                           onChange={(e) => {
                               setDiagram({...diagram, name: e.currentTarget.value})
                           }}
                           required/>
                <Textarea key="description"
                          label="Description"
                          value={diagram.description}
                          onChange={(e) => {
                              setDiagram({...diagram, description: e.currentTarget.value})
                          }}
                          placeholder="Enter diagram description"/>
                <Group>
                    <Checkbox w={250}
                              key="private"
                              label="Private"
                              checked={diagram.private}
                              onChange={(e) => {
                                  setDiagram({...diagram, private: e.currentTarget.checked})
                              }}
                              disabled={true}/>
                    <Pill>Basic</Pill>
                </Group>
                <Group>
                    <Checkbox w={250}
                              key="encrypted"
                              label="Encrypted"
                              checked={diagram.encrypted}
                              onChange={(e) => {
                                  setDiagram({...diagram, encrypted: e.currentTarget.checked})
                              }}
                              disabled={true}/>
                    <Pill>Pro</Pill>
                </Group>
                <Group>
                    <Checkbox w={250}
                              key="invite"
                              label="Invite Collaborators"
                              checked={diagram.invite}
                              onChange={(e) => {
                                  setDiagram({...diagram, invite: e.currentTarget.checked})
                              }}
                              disabled={true}/>
                    <Pill>Pro</Pill>
                </Group>
                <Group>
                    <Button key="create" onClick={createDiagram}>Create</Button>
                    <Anchor p={5} size="sm" key="cancel" onClick={(e) => {
                        e.preventDefault();
                        closeCreate()
                    }}>Cancel</Anchor>
                </Group>
            </Stack>

        </Modal>

    )
}
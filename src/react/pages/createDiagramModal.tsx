import {Anchor, Button, Checkbox, Group, Modal, Pill, Stack, Textarea, TextInput} from "@mantine/core";
import {usePouch} from "use-pouchdb";
import {useState} from "react";
import {v4} from "uuid";
import log from "loglevel";
import {useFeatureState} from "../hooks/useFeatures";
import ComingSoonBadge from "../components/ComingSoonBadge";
import UpgradeBadge from "../components/UpgradeBadge";
import {useAuth0} from "@auth0/auth0-react";

export default function CreateDiagramModal({createOpened, closeCreate}) {
    const logger = log.getLogger('createDiagramModal');
    const db = usePouch();
    const { loginWithRedirect } = useAuth0();

    // Feature flags
    const privateDesignsState = useFeatureState('privateDesigns');
    const encryptedDesignsState = useFeatureState('encryptedDesigns');
    const shareCollaborateState = useFeatureState('shareCollaborate');

    const privateDesignsEnabled = privateDesignsState === 'on';
    const encryptedDesignsEnabled = encryptedDesignsState === 'on';
    const shareCollaborateEnabled = shareCollaborateState === 'on';

    const handleSignUp = () => {
        loginWithRedirect({
            appState: { returnTo: window.location.pathname }
        });
    };

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
            logger.warn('cannot find directory', err);
        }
        const id = 'diagram-' + v4();
        const newDiagram = {...diagram, _id: id, type: 'diagram'};
        if (!doc) {
            await db.put({_id: 'directory', diagrams: [newDiagram], type: 'directory'});
        } else {
            if (doc.diagrams) {
                doc.diagrams.push(newDiagram);
            } else {
                doc.diagrams = [newDiagram];
            }
            logger.debug('new directory', doc);
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
                                  if (privateDesignsState === 'basic') {
                                      handleSignUp();
                                  } else {
                                      setDiagram({...diagram, private: e.currentTarget.checked})
                                  }
                              }}
                              disabled={!privateDesignsEnabled && privateDesignsState !== 'basic'}/>
                    {privateDesignsState === 'coming-soon' && <ComingSoonBadge />}
                    {privateDesignsState === 'basic' && <UpgradeBadge tier="basic" onClick={handleSignUp} />}
                    {privateDesignsState === 'pro' && <UpgradeBadge tier="pro" />}
                </Group>
                <Group>
                    <Checkbox w={250}
                              key="encrypted"
                              label="Encrypted"
                              checked={diagram.encrypted}
                              onChange={(e) => {
                                  if (encryptedDesignsState === 'basic') {
                                      handleSignUp();
                                  } else {
                                      setDiagram({...diagram, encrypted: e.currentTarget.checked})
                                  }
                              }}
                              disabled={!encryptedDesignsEnabled && encryptedDesignsState !== 'basic'}/>
                    {encryptedDesignsState === 'coming-soon' && <ComingSoonBadge />}
                    {encryptedDesignsState === 'basic' && <UpgradeBadge tier="basic" onClick={handleSignUp} />}
                    {encryptedDesignsState === 'pro' && <UpgradeBadge tier="pro" />}
                </Group>
                <Group>
                    <Checkbox w={250}
                              key="invite"
                              label="Invite Collaborators"
                              checked={diagram.invite}
                              onChange={(e) => {
                                  if (shareCollaborateState === 'basic') {
                                      handleSignUp();
                                  } else {
                                      setDiagram({...diagram, invite: e.currentTarget.checked})
                                  }
                              }}
                              disabled={!shareCollaborateEnabled && shareCollaborateState !== 'basic'}/>
                    {shareCollaborateState === 'coming-soon' && <ComingSoonBadge />}
                    {shareCollaborateState === 'basic' && <UpgradeBadge tier="basic" onClick={handleSignUp} />}
                    {shareCollaborateState === 'pro' && <UpgradeBadge tier="pro" />}
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
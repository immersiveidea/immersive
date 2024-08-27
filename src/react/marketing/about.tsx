import {Accordion, Card, Center} from "@mantine/core";
import PageTemplate from "../pageTemplate";

export default function About() {
    return (
        <PageTemplate>
            <Card m={64}>
                <Card.Section>
                    <Center>
                        <h1>VisuaLab VR: Unleash the Power of Immersive Diagramming</h1>
                    </Center>
                </Card.Section>
                <Card.Section>
                    <h3>Diagram complex systems effortlessly with VisuaLab VR – fast, intuitive, and 40x more
                        effective.</h3>
                </Card.Section>
                <Card.Section>
                    <Accordion defaultValue="1">
                        <Accordion.Item key="1" value="1">
                            <Accordion.Control>What is VisuaLab VR?</Accordion.Control>
                            <Accordion.Panel>
                                Step into a world where complex ideas come to life in 3D. With VisuaLab VR, you’re not
                                just
                                creating diagrams – you’re immersing yourself in them. Our cutting-edge VR technology
                                transforms the
                                way you visualize, understand, and communicate complex systems. Whether you’re mapping
                                out intricate
                                workflows, designing sophisticated models, or explaining multifaceted processes,
                                VisuaLab VR makes
                                it easy.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item key="2" value="2">
                            <Accordion.Control>Why Choose VisuaLab VR?</Accordion.Control>
                            <Accordion.Panel>
                                Immersive Experience: Traditional 2D diagrams can’t compare to the power of full
                                immersion. When you
                                step into VisuaLab VR, you interact with your diagrams in three dimensions, making it 40
                                times more
                                effective at explaining complex systems. See every connection, understand every
                                relationship, and
                                explore every detail as if you’re inside the system itself.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item key="3" value="3">
                            <Accordion.Control>Fast and Intuitive</Accordion.Control>
                            <Accordion.Panel>
                                No steep learning curve here. VisuaLab VR is designed for speed and simplicity.
                                Drag, drop, and connect elements with ease, all in a visually rich environment. Create
                                stunning
                                diagrams in minutes, not hours.
                            </Accordion.Panel>
                        </Accordion.Item>
                        <Accordion.Item key="4" value="4">
                            <Accordion.Control>Affordable Innovation</Accordion.Control>
                            <Accordion.Panel>
                                High-quality VR doesn’t have to break the bank. VisuaLab VR offers premium
                                features at a fraction of the cost, making it accessible for everyone from solo creators
                                to large
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item key="5" value="5">
                            <Accordion.Control>The Science Behind It</Accordion.Control>
                            <Accordion.Panel>
                                Studies show that immersive environments increase the ability to
                                comprehension and retention by up to 40 times compared to traditional 2D methods. By
                                engaging
                                multiple senses and providing a spatial understanding, VisuaLab VR allows you to grasp
                                complex
                                systems faster and with greater clarity. You’re not just looking at a diagram; you’re
                                experiencing
                                it. This deep engagement leads to quicker insights, more efficient problem-solving, and
                                better
                                decision-making.
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </Card.Section>
            </Card>
        </PageTemplate>
    )
}
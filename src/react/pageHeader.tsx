import {Anchor, AppShell, Burger, Button, Group, Image} from "@mantine/core";
import React from "react";
import {Link} from "react-router-dom";

export default function PageHeader() {
    const onClick = (e) => {
        e.preventDefault();
        console.log(e);
    }
    return (
        <AppShell.Header p={10}>
            <Group justify="space-between">
                <Image w={64} src="/assets/ddd.svg"/>
                <Group justify="flex-end">

                    <Group visibleFrom="sm">
                        <Anchor component={Link} key="examples" to="/examples" p={5} c="myColor" bg="none"
                                underline="hover">Examples</Anchor>
                        <Anchor component={Link} key="about" to="/" p={5} c="myColor" bg="none"
                                underline="hover">About</Anchor>
                        <Anchor component={Link} key="documentation" to="/documentation" p={5} c="myColor" bg="none"
                                underline="hover">Documentation</Anchor>
                        <Anchor component={Link} key="pricing" to="/pricing" p={5} c="myColor" bg="none"
                                underline="hover">Pricing</Anchor>
                        <Anchor component={Link} key="vrexperience" to="/db/local" p={5} c="myColor" bg="none"
                                underline="hover">VR Experience</Anchor>
                    </Group>
                    <Burger hiddenFrom="sm"/>
                    <Button key="signup">Sign up for Free</Button>
                    <Button>Login</Button>
                </Group>
            </Group>
        </AppShell.Header>
    )
}
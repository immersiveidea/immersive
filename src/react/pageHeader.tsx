import {Anchor, AppShell, Box, Burger, Button, Group, Image, Menu, Stack} from "@mantine/core";
import React from "react";
import {Link} from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";

export default function PageHeader() {

    const {user, isAuthenticated, loginWithRedirect, logout} = useAuth0();
    const picture = () => {
        if (user.picture) {
            return <Image w="32" h="32" src={user.picture} alt="user"/>
        } else {
            return <></>
        }
    }
    const userDisplay = () => {
        if (isAuthenticated) {
            return <Group>
                <Box visibleFrom="sm" component="span">{picture()}</Box>
                <Button onClick={() => logout({logoutParams: {returnTo: window.location.origin}})}>Logout</Button>
            </Group>
        } else {
            return <Button key="login" onClick={() => loginWithRedirect()}>Login</Button>
        }
    }
    return (
        <AppShell.Header p={5} m={20}>
            <Group justify="space-between">
                <Image w={64} src="/assets/dasfad-logo.svg"/>
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
                        <Anchor component={Link} key="vrexperience" to="/db/public/local" p={5} c="myColor" bg="none"
                                underline="hover">VR Experience</Anchor>
                    </Group>
                    <Menu trigger="click" openDelay={50} closeDelay={400}>
                        <Menu.Target>
                            <Burger hiddenFrom="sm"/>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item><Anchor size="xl" component={Link} key="examples" to="/examples" p={5}
                                               c="myColor" bg="none"
                                               underline="hover">Examples</Anchor></Menu.Item>
                            <Menu.Item><Anchor size="xl" component={Link} key="about" to="/" p={5} c="myColor" bg="none"
                                               underline="hover">About</Anchor></Menu.Item>
                            <Menu.Item><Anchor size="xl" component={Link} key="documentation" to="/documentation" p={5}
                                               c="myColor" bg="none"
                                               underline="hover">Documentation</Anchor></Menu.Item>
                            <Menu.Item><Anchor size="xl" component={Link} key="pricing" to="/pricing" p={5} c="myColor"
                                               bg="none"
                                               underline="hover">Pricing</Anchor></Menu.Item>
                            <Menu.Item><Anchor size="xl" component={Link} key="vrexperience" to="/db/public/local" p={5}
                                               c="myColor" bg="none"
                                               underline="hover">VR Experience</Anchor></Menu.Item>
                        </Menu.Dropdown>

                    </Menu>
                    {userDisplay()}
                </Group>
            </Group>
            <Stack>

            </Stack>
        </AppShell.Header>
    )
}
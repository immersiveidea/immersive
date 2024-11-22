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
    const items = [{name: 'Examples', href: '/examples', key: 'examples'},
        {name: 'About', href: '/', key: 'about'},
        {name: 'Documentation', href: '/documentation', key: 'documentation'},
        {name: 'Pricing', href: '/pricing', key: 'pricing'},
        {name: 'VR Experience', href: '/db/public/local', key: 'vrexperience'}]
    const mainMenu = function () {
        return items.map((item) => {
            return (
                <Anchor component={Link} key={item.key} to={item.href} p={5} c="myColor" bg="none"
                        underline="hover">{item.name}</Anchor>
            )
        })
    }
    const miniMenu = function () {
        return items.map((item) => {
            return (
                <Menu.Item><Anchor size="xl" component={Link} key={item.key}
                                   to={item.href} p={5}
                                   c="myColor" bg="none"
                                   underline="hover">{item.name}</Anchor></Menu.Item>
            )
        })
    }

    return (
        <AppShell.Header p={5} m={20}>
            <Group justify="space-between">
                <Image w={64} src="/assets/dasfad-logo.svg"/>
                <Group justify="flex-end">

                    <Group visibleFrom="sm">
                        {mainMenu()}
                    </Group>
                    <Menu trigger="click" openDelay={50} closeDelay={400}>
                        <Menu.Target>
                            <Burger hiddenFrom="sm"/>
                        </Menu.Target>
                        <Menu.Dropdown hiddenFrom="sm">
                            {miniMenu()}
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
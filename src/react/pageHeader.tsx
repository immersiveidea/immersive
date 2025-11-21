import {Anchor, AppShell, Box, Burger, Button, Group, Image, Menu, Stack} from "@mantine/core";
import React from "react";
import {Link} from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";
import {usePageState} from "./hooks/useFeatures";
import ComingSoonBadge from "./components/ComingSoonBadge";

export default function PageHeader() {
    const {user, isAuthenticated, loginWithRedirect, logout} = useAuth0();
    const examplesState = usePageState('examples');
    const documentationState = usePageState('documentation');
    const pricingState = usePageState('pricing');
    const vrExperienceState = usePageState('vrExperience');

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

    // Define all possible menu items with their states
    const allItems = [
        {name: 'Examples', href: '/examples', key: 'examples', state: examplesState},
        {name: 'About', href: '/', key: 'about', state: 'on' as const}, // About (home) is always visible
        {name: 'Documentation', href: '/documentation', key: 'documentation', state: documentationState},
        {name: 'Pricing', href: '/pricing', key: 'pricing', state: pricingState},
        {name: 'VR Experience', href: '/db/public/local', key: 'vrexperience', state: vrExperienceState}
    ];

    // Filter to only 'on' and 'coming-soon' items (hide 'off' items)
    const items = allItems.filter(item => item.state !== 'off')
    const mainMenu = function () {
        return items.map((item) => {
            const isComingSoon = item.state === 'coming-soon';
            return (
                <Group key={item.key} gap="xs">
                    <Anchor
                        component={isComingSoon ? 'span' : Link}
                        to={isComingSoon ? undefined : item.href}
                        p={5}
                        c={isComingSoon ? 'dimmed' : 'myColor'}
                        bg="none"
                        underline="hover"
                        style={{
                            cursor: isComingSoon ? 'not-allowed' : 'pointer',
                            pointerEvents: isComingSoon ? 'none' : 'auto'
                        }}
                    >
                        {item.name}
                    </Anchor>
                    {isComingSoon && <ComingSoonBadge size="xs" />}

                </Group>
            )
        })
    }
    const miniMenu = function () {
        return items.map((item) => {
            const isComingSoon = item.state === 'coming-soon';
            return (
                <Menu.Item
                    key={item.key}
                    disabled={isComingSoon}
                >
                    <Group gap="xs">
                        <Anchor
                            size="xl"
                            component={isComingSoon ? 'span' : Link}
                            to={isComingSoon ? undefined : item.href}
                            p={5}
                            c={isComingSoon ? 'dimmed' : 'myColor'}
                            bg="none"
                            underline="hover"
                            style={{
                                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                                pointerEvents: isComingSoon ? 'none' : 'auto'
                            }}
                        >
                            {item.name}
                        </Anchor>
                        {isComingSoon && <ComingSoonBadge size="xs" />}
                    </Group>
                </Menu.Item>
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
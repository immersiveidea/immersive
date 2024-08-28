import {AppShell, MantineProvider} from "@mantine/core";
import PageHeader from "./pageHeader";
import React from "react";
import {theme} from "./theme";

export default function PageTemplate(props: { children: React.ReactNode }) {
    return (
        <MantineProvider defaultColorScheme="dark" theme={theme}>
        <AppShell
            header={{height: 64}}>
            <PageHeader/>
            <AppShell.Main>
                {props.children}
            </AppShell.Main>
        </AppShell>
        </MantineProvider>
    )
}
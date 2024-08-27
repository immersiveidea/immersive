import {AppShell} from "@mantine/core";
import PageHeader from "./pageHeader";
import React from "react";

export default function PageTemplate(props: { children: React.ReactNode }) {
    return (
        <AppShell
            header={{height: 64}}>
            <PageHeader/>
            <AppShell.Main>
                {props.children}
            </AppShell.Main>
        </AppShell>
    )
}
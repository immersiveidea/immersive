import {Container, MantineProvider} from "@mantine/core";

import React from "react";
import {theme} from "./theme";
import {Provider} from "use-pouchdb";
import PouchDB from 'pouchdb';

const db = new PouchDB('mydb');
export default function VrTemplate(props: { children: React.ReactNode }) {
    return (
        <Provider pouchdb={db}>
            <MantineProvider defaultColorScheme="dark" theme={theme}>

        <Container fluid={true}>
            {props.children}
        </Container>
            </MantineProvider>
        </Provider>
    )
}

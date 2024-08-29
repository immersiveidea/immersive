import {Container, MantineProvider} from "@mantine/core";

import React from "react";
import {theme} from "./theme";
import {Provider} from "use-pouchdb";
import PouchDB from 'pouchdb';
import {DEFAULT_DB_NAME} from "../util/constants";


const db = new PouchDB(DEFAULT_DB_NAME);
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

import {Container} from "@mantine/core";

import React from "react";

export default function VrTemplate(props: { children: React.ReactNode }) {
    return (
        <Container fluid={true}>
            {props.children}
        </Container>
    )
}

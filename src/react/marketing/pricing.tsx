import {Card, SimpleGrid} from "@mantine/core";
import PageTemplate from "../pageTemplate";

export default function Pricing() {
    return (
        <PageTemplate>
            <h1>Pricing</h1>
            <SimpleGrid cols={{base: 1, sm: 2, md: 3}} spacing="lg">
                <Card>
                    Free
                </Card>
                <Card>
                    Basic
                </Card>
                <Card>
                    Team
                </Card>
            </SimpleGrid>
            <p>Some information about the pricing</p>
        </PageTemplate>
    )
}
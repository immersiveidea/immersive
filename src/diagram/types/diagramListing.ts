export enum DiagramListingEventType {
    GET,
    ADD,
    REMOVE,
    MODIFY
}

export type DiagramListingEvent = {
    type: DiagramListingEventType;
    listing: DiagramListing;
}
export type DiagramListing = {
    type: DiagramListingEvent;
    id: string;
    name: string;
    description?: string;
    sharekey?: string;
}
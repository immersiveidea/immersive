export enum DiagramListingEventType {
    GET,
    ADD,
    REMOVE,
    MODIFY,
    GETALL,
}

export type DiagramListingEvent = {
    type: DiagramListingEventType;
    listing?: DiagramListing;
}
export type DiagramListing = {
    id: string;
    name: string;
    description?: string;
    sharekey?: string;
}
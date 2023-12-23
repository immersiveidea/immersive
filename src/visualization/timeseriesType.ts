export type TimeseriesType = {
    name: string;
    values: TimepointType[];
}
export type TimepointType = {
    id?: string,
    start?: string | number;
    end: string | number;
    value: number;
}
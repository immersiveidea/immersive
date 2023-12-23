import {ChartDataType} from "../chartDataType";
import {TimepointType, TimeseriesType} from "../timeseriesType";

export function genData(): ChartDataType {
    return {
        name: "test",
        series: [
            testDataSeries("series1"),
            testDataSeries("series2"),
            testDataSeries("series3"),
            testDataSeries("series4"),
            testDataSeries("series5"),
            testDataSeries("series6"),
            testDataSeries("series7"),
            testDataSeries("series8"),
            testDataSeries("series9"),
            testDataSeries("series10"),
            testDataSeries("series11"),
            testDataSeries("series12"),
            testDataSeries("series13"),
            testDataSeries("series14"),
            testDataSeries("series15"),
            testDataSeries("series16"),
            testDataSeries("series17"),
            testDataSeries("series18"),
            testDataSeries("series19"),
            testDataSeries("series20"),


        ]
    }
}

function testDataSeries(name: string): TimeseriesType {
    const data = {
        name: name,
        values: getValues()
    };
    return data;
}

function getValues(): TimepointType[] {
    const data: TimepointType[] = [];
    const count = 150;
    let val = Math.random() * 50 + 25;
    for (let i = 0; i < count; i++) {
        let rand = (Math.random() * 4 - 2);
        if (Math.abs(rand) < .15) {
            rand = (Math.random() * 10 - 5);
        }
        data.push({
            start: i,
            end: i + 1,
            value: val += rand
        });
    }
    return data;
}
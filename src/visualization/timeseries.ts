import {TransformNode, Vector3} from "@babylonjs/core";
import {TimeseriesType} from "./timeseriesType";
import {buildContainer} from "./functions/buildContainer";
import {ChartDataType} from "./chartDataType";
import {buildSeries} from "./functions/buildSeries";

export class Timeseries {
    private parent: TransformNode;
    private data: ChartDataType;
    private size: Vector3 = new Vector3(1, 1, 1);

    constructor(parent: TransformNode) {
        this.parent = parent;
        this.parent.onDisposeObservable.add(() => {
            this.parent = null;
        });
    }

    public setData(data: ChartDataType) {
        this.data = data;
        if (this.parent) {
            this.build();
        }
    }

    public fetchData(url: string) {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.setData((data as ChartDataType));
            });
    }

    build() {
        const scene = this.parent.getScene();
        if (!scene || !this.data) {
            return;
        }
        buildContainer(this.parent, this.size);
        const seriesCount = this.data.series.length;
        this.data.series.forEach((series: TimeseriesType, index: number) => {
            buildSeries(this.parent, series, index, seriesCount, .01);
        });
        this.parent.scaling = new Vector3(5, 5, 5);
    }
}

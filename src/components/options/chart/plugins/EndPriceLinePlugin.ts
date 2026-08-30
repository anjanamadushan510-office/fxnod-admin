import {
    ISeriesPrimitive,
    IPrimitivePaneView,
    IPrimitivePaneRenderer,
    SeriesAttachedParameter,
    Time,
    IChartApi,
    ISeriesApi,
    SeriesType
} from 'lightweight-charts';

class EndPriceLineRenderer implements IPrimitivePaneRenderer {
    private _chart: IChartApi | null = null;
    private _series: ISeriesApi<SeriesType> | null = null;
    private _time: Time | null = null;
    private _price: number | null = null;
    private _color: string;

    constructor(color: string) {
        this._color = color;
    }

    update(chart: IChartApi, series: ISeriesApi<SeriesType>, time: Time | null, price: number | null) {
        this._chart = chart;
        this._series = series;
        this._time = time;
        this._price = price;
    }

    draw(target: any) {
        if (!this._chart || !this._series || this._time === null || this._price === null) return;

        const x = this._chart.timeScale().timeToCoordinate(this._time);
        const y = this._series.priceToCoordinate(this._price);

        if (x === null || y === null) return;

        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            
            // Adjust for device pixel ratio
            const xPos = x * scope.horizontalPixelRatio;
            const yPos = y * scope.verticalPixelRatio;
            
            ctx.beginPath();
            ctx.moveTo(xPos, yPos);
            ctx.lineTo(scope.bitmapSize.width, yPos); // Draw to the right edge
            ctx.strokeStyle = this._color;
            ctx.lineWidth = 1 * scope.verticalPixelRatio;
            // set dashed line style
            // ctx.setLineDash([4 * scope.horizontalPixelRatio, 4 * scope.horizontalPixelRatio]);
            ctx.stroke();
            // ctx.setLineDash([]);
        });
    }
}

class EndPriceLinePaneView implements IPrimitivePaneView {
    private _renderer: EndPriceLineRenderer;

    constructor(color: string) {
        this._renderer = new EndPriceLineRenderer(color);
    }

    update(chart: IChartApi, series: ISeriesApi<SeriesType>, time: Time | null, price: number | null) {
        this._renderer.update(chart, series, time, price);
    }

    renderer() {
        return this._renderer;
    }
}

export class EndPriceLinePlugin implements ISeriesPrimitive {
    private _paneViews: EndPriceLinePaneView[];
    private _chart: IChartApi | null = null;
    private _series: ISeriesApi<SeriesType> | null = null;
    private _requestUpdate: (() => void) | null = null;
    
    private _time: Time | null = null;
    private _price: number | null = null;

    constructor(color: string = '#000000') {
        this._paneViews = [new EndPriceLinePaneView(color)];
    }

    attached(param: SeriesAttachedParameter<Time>) {
        this._chart = param.chart;
        this._series = param.series;
        this._requestUpdate = param.requestUpdate;
    }

    detached() {
        this._chart = null;
        this._series = null;
        this._requestUpdate = null;
    }

    updatePosition(time: Time | null, price: number | null) {
        this._time = time;
        this._price = price;
        if (this._chart && this._series) {
            this._paneViews[0].update(this._chart, this._series, this._time, this._price);
            if (this._requestUpdate) this._requestUpdate();
        }
    }

    paneViews() {
        return this._paneViews;
    }
}

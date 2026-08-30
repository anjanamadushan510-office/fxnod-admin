import {
    ISeriesPrimitive,
    IPrimitivePaneView,
    IPrimitivePaneRenderer,
    SeriesAttachedParameter,
    UTCTimestamp
} from "lightweight-charts";
import { CHART_COLORS } from "../chartColors";

export interface TickSpot {
    time: UTCTimestamp;
    price: number;
    label: string; // '1', '2', or '' for entry
    isEntry: boolean;
}

export class TickSpotsPlugin implements ISeriesPrimitive {
    private _series: SeriesAttachedParameter | null = null;
    private _requestUpdate: () => void = () => {};
    private _ticks: TickSpot[];

    constructor(ticks: TickSpot[]) {
        this._ticks = ticks;
    }

    attached(param: SeriesAttachedParameter) {
        this._series = param;
        this._requestUpdate = param.requestUpdate;
        this._requestUpdate();
    }

    detached() {
        this._series = null;
    }

    updateAllViews() {
        this._requestUpdate();
    }

    paneViews(): readonly IPrimitivePaneView[] {
        if (!this._series) return [];
        return [new TickSpotsPaneView(this._series, this._ticks)];
    }
}

class TickSpotsPaneView implements IPrimitivePaneView {
    private _series: SeriesAttachedParameter;
    private _ticks: TickSpot[];

    constructor(series: SeriesAttachedParameter, ticks: TickSpot[]) {
        this._series = series;
        this._ticks = ticks;
    }

    zOrder() {
        return "top" as const;
    }

    update() {}

    renderer(): IPrimitivePaneRenderer | null {
        return new TickSpotsRenderer(this._series, this._ticks);
    }
}

class TickSpotsRenderer implements IPrimitivePaneRenderer {
    private _series: SeriesAttachedParameter;
    private _ticks: TickSpot[];

    constructor(series: SeriesAttachedParameter, ticks: TickSpot[]) {
        this._series = series;
        this._ticks = ticks;
    }

    draw(target: any) {
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            
            for (const tick of this._ticks) {
                const x = this._series.chart.timeScale().timeToCoordinate(tick.time);
                if (x === null) continue;
                
                const y = this._series.series.priceToCoordinate(tick.price);
                if (y === null) continue;
                
                // Convert to bitmap coordinates
                const pixelRatio = scope.horizontalPixelRatio;
                const bx = Math.round(x * pixelRatio);
                const by = Math.round(y * pixelRatio);
                
                if (tick.isEntry) {
                    // Entry spot: white circle with solid black border
                    const radius = 6 * pixelRatio;
                    ctx.beginPath();
                    ctx.arc(bx, by, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = "#ffffff";
                    ctx.fill();
                    ctx.lineWidth = 1.5 * pixelRatio;
                    ctx.strokeStyle = CHART_COLORS.ink;
                    ctx.stroke();
                } else {
                    // Intermediate tick: white circle with grey border, number inside
                    const radius = 7 * pixelRatio;
                    ctx.beginPath();
                    ctx.arc(bx, by, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = "#ffffff";
                    ctx.fill();
                    ctx.lineWidth = 1 * pixelRatio;
                    ctx.strokeStyle = CHART_COLORS.inkFaint;
                    ctx.stroke();
                    
                    // Number inside
                    ctx.font = `bold ${9 * pixelRatio}px Arial, sans-serif`;
                    ctx.fillStyle = CHART_COLORS.ink;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    // slight adjustment for vertical centering of numbers
                    ctx.fillText(tick.label, bx, by + 1 * pixelRatio);
                }
            }
        });
    }
}

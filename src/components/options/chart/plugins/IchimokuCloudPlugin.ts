import {
    ISeriesPrimitive,
    IPrimitivePaneView,
    IPrimitivePaneRenderer,
    SeriesAttachedParameter,
    UTCTimestamp
} from "lightweight-charts";

export interface CloudData {
    time: UTCTimestamp;
    value: number;
}

export class IchimokuCloudPlugin implements ISeriesPrimitive {
    private _series: SeriesAttachedParameter | null = null;
    private _requestUpdate: () => void = () => {};

    private _senkouA: CloudData[] = [];
    private _senkouB: CloudData[] = [];
    private _upColor: string;
    private _downColor: string;

    constructor(
        senkouA: CloudData[],
        senkouB: CloudData[],
        upColor: string,
        downColor: string
    ) {
        this._senkouA = senkouA;
        this._senkouB = senkouB;
        this._upColor = upColor;
        this._downColor = downColor;
    }

    attached(param: SeriesAttachedParameter) {
        this._series = param;
        this._requestUpdate = param.requestUpdate;
        this._requestUpdate();
    }

    detached() {
        this._series = null;
    }

    detach() {
        this.detached();
    }

    paneViews(): readonly IPrimitivePaneView[] {
        if (!this._series) return [];
        return [new IchimokuCloudPaneView(
            this._series,
            this._senkouA,
            this._senkouB,
            this._upColor,
            this._downColor
        )];
    }

    updateData(senkouA: CloudData[], senkouB: CloudData[], upColor?: string, downColor?: string) {
        this._senkouA = senkouA;
        this._senkouB = senkouB;
        if (upColor) this._upColor = upColor;
        if (downColor) this._downColor = downColor;
        
        // Also update the pane view which holds the colors! Wait!
        this._requestUpdate();
    }

    update() {
        this._requestUpdate();
    }
}

class IchimokuCloudPaneView implements IPrimitivePaneView {
    private _series: SeriesAttachedParameter;
    private _senkouA: CloudData[];
    private _senkouB: CloudData[];
    private _upColor: string;
    private _downColor: string;

    constructor(
        series: SeriesAttachedParameter,
        senkouA: CloudData[],
        senkouB: CloudData[],
        upColor: string,
        downColor: string
    ) {
        this._series = series;
        this._senkouA = senkouA;
        this._senkouB = senkouB;
        this._upColor = upColor;
        this._downColor = downColor;
    }

    zOrder() {
        return "bottom" as const;
    }

    renderer(): IPrimitivePaneRenderer | null {
        return new IchimokuCloudRenderer(
            this._series,
            this._senkouA,
            this._senkouB,
            this._upColor,
            this._downColor
        );
    }
}

class IchimokuCloudRenderer implements IPrimitivePaneRenderer {
    private _series: SeriesAttachedParameter;
    private _senkouA: CloudData[];
    private _senkouB: CloudData[];
    private _upColor: string;
    private _downColor: string;

    constructor(
        series: SeriesAttachedParameter,
        senkouA: CloudData[],
        senkouB: CloudData[],
        upColor: string,
        downColor: string
    ) {
        this._series = series;
        this._senkouA = senkouA;
        this._senkouB = senkouB;
        this._upColor = upColor;
        this._downColor = downColor;
    }

    draw(target: any) {
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            const timeScale = this._series.chart.timeScale();
            
            // Fast lookup for B
            const bMap = new Map<UTCTimestamp, number>();
            for (let i = 0; i < this._senkouB.length; i++) {
                bMap.set(this._senkouB[i].time, this._senkouB[i].value);
            }

            const points: {time: UTCTimestamp, valA: number, valB: number}[] = [];
            for (let i = 0; i < this._senkouA.length; i++) {
                const a = this._senkouA[i];
                if (bMap.has(a.time)) {
                    points.push({
                        time: a.time,
                        valA: a.value,
                        valB: bMap.get(a.time)!
                    });
                }
            }

            if (points.length < 2) return;

            let currentUp = points[0].valA >= points[0].valB;
            let segmentPoints: {x: number, yA: number, yB: number}[] = [];

            const drawSegment = (isUp: boolean, segPoints: typeof segmentPoints) => {
                if (segPoints.length < 2) return;
                ctx.beginPath();
                ctx.fillStyle = isUp ? this._upColor : this._downColor;
                
                // Top edge
                ctx.moveTo(segPoints[0].x, segPoints[0].yA);
                for (let i = 1; i < segPoints.length; i++) {
                    ctx.lineTo(segPoints[i].x, segPoints[i].yA);
                }
                
                // Bottom edge (reverse order)
                for (let i = segPoints.length - 1; i >= 0; i--) {
                    ctx.lineTo(segPoints[i].x, segPoints[i].yB);
                }
                
                ctx.closePath();
                ctx.fill();
            };

            const visibleRange = timeScale.getVisibleLogicalRange();
            
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const x = timeScale.timeToCoordinate(p.time);
                // We shouldn't skip if x is null because it might be just out of bounds and we still need it to draw the continuous polygon
                if (x === null) continue; // For now, skip if time is not on scale. Lightweight charts might return null if time is not on scale.
                
                // Actually, if it's completely out of the visible range by far, we could optimize, but canvas handles off-screen rendering well.

                const yA = this._series.series.priceToCoordinate(p.valA);
                const yB = this._series.series.priceToCoordinate(p.valB);
                if (yA === null || yB === null) continue;

                const logicalX = Math.round(x * scope.horizontalPixelRatio);
                const logicalYA = Math.round(yA * scope.verticalPixelRatio);
                const logicalYB = Math.round(yB * scope.verticalPixelRatio);

                const isUp = p.valA >= p.valB;
                if (isUp !== currentUp && segmentPoints.length > 0) {
                    segmentPoints.push({x: logicalX, yA: logicalYA, yB: logicalYB});
                    drawSegment(currentUp, segmentPoints);
                    segmentPoints = [{x: logicalX, yA: logicalYA, yB: logicalYB}];
                    currentUp = isUp;
                } else {
                    segmentPoints.push({x: logicalX, yA: logicalYA, yB: logicalYB});
                }
            }
            if (segmentPoints.length > 1) {
                drawSegment(currentUp, segmentPoints);
            }
        });
    }
}

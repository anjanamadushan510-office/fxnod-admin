import {
    ISeriesPrimitive,
    IPrimitivePaneView,
    IPrimitivePaneRenderer,
    SeriesAttachedParameter,
    UTCTimestamp
} from "lightweight-charts";

export class ExitSpotPlugin implements ISeriesPrimitive {
    private _series: SeriesAttachedParameter | null = null;
    private _requestUpdate: () => void = () => {};

    private _time: UTCTimestamp;
    private _price: number;
    private _timeLabel: string;
    private _priceLabel: string;
    private _isWon: boolean;
    private _isTickContract: boolean;
    private _tickNumber?: number;

    constructor(
        time: UTCTimestamp,
        price: number,
        timeLabel: string,
        priceLabel: string,
        isWon: boolean,
        isTickContract: boolean,
        tickNumber?: number
    ) {
        this._time = time;
        this._price = price;
        this._timeLabel = timeLabel;
        this._priceLabel = priceLabel;
        this._isWon = isWon;
        this._isTickContract = isTickContract;
        this._tickNumber = tickNumber;
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
        return [new ExitSpotPaneView(this._series, this._time, this._price, this._timeLabel, this._priceLabel, this._isWon, this._isTickContract, this._tickNumber)];
    }
}

class ExitSpotPaneView implements IPrimitivePaneView {
    private _series: SeriesAttachedParameter;
    private _time: UTCTimestamp;
    private _price: number;
    private _timeLabel: string;
    private _priceLabel: string;
    private _isWon: boolean;
    private _isTickContract: boolean;
    private _tickNumber?: number;

    constructor(
        series: SeriesAttachedParameter,
        time: UTCTimestamp,
        price: number,
        timeLabel: string,
        priceLabel: string,
        isWon: boolean,
        isTickContract: boolean,
        tickNumber?: number
    ) {
        this._series = series;
        this._time = time;
        this._price = price;
        this._timeLabel = timeLabel;
        this._priceLabel = priceLabel;
        this._isWon = isWon;
        this._isTickContract = isTickContract;
        this._tickNumber = tickNumber;
    }

    zOrder() {
        return "top" as const;
    }

    update() {}

    renderer(): IPrimitivePaneRenderer | null {
        return new ExitSpotRenderer(
            this._series,
            this._time,
            this._price,
            this._timeLabel,
            this._priceLabel,
            this._isWon,
            this._isTickContract,
            this._tickNumber
        );
    }
}

class ExitSpotRenderer implements IPrimitivePaneRenderer {
    private _series: SeriesAttachedParameter;
    private _time: UTCTimestamp;
    private _price: number;
    private _timeLabel: string;
    private _priceLabel: string;
    private _isWon: boolean;
    private _isTickContract: boolean;
    private _tickNumber?: number;

    constructor(
        series: SeriesAttachedParameter,
        time: UTCTimestamp,
        price: number,
        timeLabel: string,
        priceLabel: string,
        isWon: boolean,
        isTickContract: boolean,
        tickNumber?: number
    ) {
        this._series = series;
        this._time = time;
        this._price = price;
        this._timeLabel = timeLabel;
        this._priceLabel = priceLabel;
        this._isWon = isWon;
        this._isTickContract = isTickContract;
        this._tickNumber = tickNumber;
    }

    draw(target: any) {
        const timeScale = this._series.chart.timeScale();
        const x = timeScale.timeToCoordinate(this._time);
        const y = this._series.series.priceToCoordinate(this._price);

        if (x === null || y === null) return;

        target.useMediaCoordinateSpace((scope: any) => {
            const ctx = scope.context as CanvasRenderingContext2D;
            const color = this._isWon ? "#00a79e" : "#e91e63"; // rise/fall

            ctx.save();
            
            // 1. Draw vertical dashed line
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, scope.mediaSize.height);
            ctx.strokeStyle = "#999999";
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.stroke();

            // 2. Draw flag at the bottom of the line
            ctx.fillStyle = "#333333";
            const flagSize = 12;
            const flagY = scope.mediaSize.height - flagSize;
            
            ctx.beginPath();
            // Flag pole
            ctx.rect(x - 1, flagY, 2, flagSize);
            // Flag cloth
            ctx.rect(x + 1, flagY, 8, 8);
            ctx.fill();
            
            // 3. Draw big black dot at (x, y)
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = "#333333"; 
            ctx.fill();

            // Draw number inside if tick contract
            if (this._isTickContract && this._tickNumber !== undefined) {
                ctx.font = "bold 9px Arial, sans-serif";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(this._tickNumber), x, y + 1);
            }

            // 4. Draw the tooltip label
            let labelWidth = 64;
            const topHeight = 20;
            const bottomHeight = 22;
            
            // Measure price label width to ensure it fits
            ctx.font = "bold 11px Inter, sans-serif";
            const priceWidth = ctx.measureText(this._priceLabel).width;
            if (priceWidth + 16 > labelWidth) {
                labelWidth = priceWidth + 16;
            }
            
            const labelX = x - labelWidth / 2;
            const labelY = y - topHeight - bottomHeight - 8; // 8px for arrow

            // Arrow
            ctx.beginPath();
            ctx.moveTo(x, labelY + topHeight + bottomHeight + 6);
            ctx.lineTo(x - 5, labelY + topHeight + bottomHeight);
            ctx.lineTo(x + 5, labelY + topHeight + bottomHeight);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            // Top Box (Time)
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(labelX, labelY, labelWidth, topHeight, [6, 6, 0, 0]);
            } else {
                ctx.rect(labelX, labelY, labelWidth, topHeight);
            }
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            
            // Reset shadow for the rest
            ctx.shadowColor = 'transparent';
            
            // Bottom Box (Price)
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(labelX, labelY + topHeight, labelWidth, bottomHeight, [0, 0, 6, 6]);
            } else {
                ctx.rect(labelX, labelY + topHeight, labelWidth, bottomHeight);
            }
            ctx.fillStyle = color;
            ctx.fill();
            
            // Time Text
            ctx.fillStyle = "#333333";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Draw clock icon (simple circle with hands)
            const clockX = labelX + 12;
            const clockY = labelY + topHeight / 2;
            ctx.beginPath();
            ctx.arc(clockX, clockY, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = "#666666";
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(clockX, clockY);
            ctx.lineTo(clockX, clockY - 2);
            ctx.moveTo(clockX, clockY);
            ctx.lineTo(clockX + 2, clockY);
            ctx.stroke();

            ctx.fillText(this._timeLabel, labelX + labelWidth / 2 + 5, clockY + 1);

            // Price Text
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Inter, sans-serif";
            ctx.fillText(this._priceLabel, x, labelY + topHeight + bottomHeight / 2 + 1);

            // Outline around the whole thing
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(labelX, labelY, labelWidth, topHeight + bottomHeight, 6);
            } else {
                ctx.rect(labelX, labelY, labelWidth, topHeight + bottomHeight);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
        });
    }
}

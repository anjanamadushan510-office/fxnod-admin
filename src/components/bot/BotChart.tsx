"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { bollinger, rsi, sma } from "./indicators";

/**
 * The dBot chart: candles with Bollinger Bands and an SMA overlay, plus an RSI
 * sub-panel — the indicator set the bots actually read.
 *
 * Drawn as a plain SVG rather than reusing the dTrader `LiveChart`. That
 * component is a live lightweight-charts instance wired to the options market
 * stream and has no indicator-overlay support; teaching it one while it is the
 * working manual-trading chart is a bigger, riskier change than it looks.
 *
 * FOLLOW-UP: once `/ws` carries bot-run candles, unify the two — dBot should
 * not keep a second charting implementation forever.
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface BotChartProps {
  candles: Candle[];
  /** Rendered in the legend, e.g. "Volatility 75 Index". */
  className?: string;
}

const PRICE_H = 210;
const RSI_H = 74;
const GAP = 16;
const AXIS_W = 52;
const VIEW_W = 520;
const VIEW_H = PRICE_H + GAP + RSI_H + 20;

export function BotChart({ candles, className }: BotChartProps) {
  const model = useMemo(() => buildModel(candles), [candles]);

  if (!model) {
    return (
      <div className={cn("grid place-items-center px-5 py-12", className)}>
        <p className="m-0 max-w-[32ch] text-center text-[12px] leading-relaxed text-opt-ink-3">
          Not enough price history to draw the chart yet.
        </p>
      </div>
    );
  }

  const { bars, bbUpper, bbLower, smaPath, rsiPath, priceTicks, timeTicks } = model;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2 px-4 py-3", className)}>
      <Legend />

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Price chart with Bollinger Bands, moving average and RSI"
        className="h-full w-full flex-1"
      >
        {/* ── Price pane ─────────────────────────────────────────────── */}
        {priceTicks.map((tick) => (
          <g key={`p-${tick.value}`}>
            <line
              x1={0}
              x2={VIEW_W - AXIS_W}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--opt-line)"
              strokeWidth={0.6}
            />
            <text
              x={VIEW_W - AXIS_W + 6}
              y={tick.y + 3}
              fontSize={8}
              fill="var(--opt-ink-3)"
              className="tabular-nums"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <path d={bbUpper} fill="none" stroke="var(--opt-rise)" strokeWidth={1.1} opacity={0.85} />
        <path d={bbLower} fill="none" stroke="var(--opt-rise)" strokeWidth={1.1} opacity={0.85} />
        <path d={smaPath} fill="none" stroke="#3b82f6" strokeWidth={1.1} />

        {bars.map((bar, i) => (
          <g key={`c-${i}`}>
            <line
              x1={bar.x}
              x2={bar.x}
              y1={bar.highY}
              y2={bar.lowY}
              stroke={bar.up ? "var(--opt-rise)" : "var(--opt-fall)"}
              strokeWidth={0.7}
            />
            <rect
              x={bar.x - bar.halfW}
              y={bar.bodyY}
              width={bar.halfW * 2}
              height={Math.max(0.8, bar.bodyH)}
              fill={bar.up ? "var(--opt-rise)" : "var(--opt-fall)"}
            />
          </g>
        ))}

        {/* ── RSI pane ───────────────────────────────────────────────── */}
        <g>
          {[20, 40, 60, 80].map((level) => {
            const y = PRICE_H + GAP + RSI_H - (level / 100) * RSI_H;
            return (
              <g key={`r-${level}`}>
                <line
                  x1={0}
                  x2={VIEW_W - AXIS_W}
                  y1={y}
                  y2={y}
                  stroke="var(--opt-line)"
                  strokeWidth={0.6}
                />
                <text
                  x={VIEW_W - AXIS_W + 6}
                  y={y + 3}
                  fontSize={8}
                  fill="var(--opt-ink-3)"
                  className="tabular-nums"
                >
                  {level}
                </text>
              </g>
            );
          })}
          <path d={rsiPath} fill="none" stroke="#8b5cf6" strokeWidth={1.2} />
          <text x={2} y={PRICE_H + GAP + 9} fontSize={9} fill="var(--opt-ink-3)">
            RSI (14)
          </text>
        </g>

        {/* ── Time axis ──────────────────────────────────────────────── */}
        {timeTicks.map((tick) => (
          <text
            key={`t-${tick.label}`}
            x={tick.x}
            y={VIEW_H - 4}
            fontSize={8}
            textAnchor="middle"
            fill="var(--opt-ink-3)"
            className="tabular-nums"
          >
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium">
      <LegendItem color="var(--opt-rise)" label="BB Upper (20, 2)" />
      <LegendItem color="var(--opt-rise)" label="BB Lower (20, 2)" />
      <LegendItem color="#3b82f6" label="SMA (20)" />
      <LegendItem color="#8b5cf6" label="RSI (14)" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-opt-ink-2">
      <span
        aria-hidden="true"
        className="inline-block h-[2px] w-4 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// ─── Geometry ────────────────────────────────────────────────────────────────

function buildModel(candles: Candle[]) {
  // Bollinger(20) needs 20 bars before it produces anything; without them the
  // chart would be candles and three empty overlays.
  if (candles.length < 24) return null;

  const closes = candles.map((c) => c.close);
  const bands = bollinger(closes, 20, 2);
  const smaSeries = sma(closes, 20);
  const rsiSeries = rsi(closes, 14);

  // Scale to everything actually drawn, bands included — scaling to candles
  // alone would clip the bands out of the pane.
  const lows = [
    ...candles.map((c) => c.low),
    ...bands.lower.filter(isNum),
  ];
  const highs = [
    ...candles.map((c) => c.high),
    ...bands.upper.filter(isNum),
  ];
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;
  const pad = span * 0.06;
  const lo = min - pad;
  const hi = max + pad;

  const plotW = VIEW_W - AXIS_W;
  const stepX = plotW / candles.length;
  const halfW = Math.max(1, stepX * 0.3);

  const xAt = (i: number) => i * stepX + stepX / 2;
  const yAt = (price: number) => PRICE_H - ((price - lo) / (hi - lo)) * PRICE_H;

  const bars = candles.map((c, i) => {
    const up = c.close >= c.open;
    const bodyTop = yAt(Math.max(c.open, c.close));
    const bodyBottom = yAt(Math.min(c.open, c.close));
    return {
      x: xAt(i),
      halfW,
      up,
      highY: yAt(c.high),
      lowY: yAt(c.low),
      bodyY: bodyTop,
      bodyH: bodyBottom - bodyTop,
    };
  });

  const priceTicks = Array.from({ length: 5 }, (_, i) => {
    const value = lo + ((hi - lo) * i) / 4;
    return {
      value,
      y: yAt(value),
      label: value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  });

  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const i = Math.min(candles.length - 1, Math.round(f * (candles.length - 1)));
    const d = new Date(candles[i].time);
    return {
      x: xAt(i),
      label: `${String(d.getUTCHours()).padStart(2, "0")}:${String(
        d.getUTCMinutes(),
      ).padStart(2, "0")}`,
    };
  });

  const rsiY = (v: number) => PRICE_H + GAP + RSI_H - (v / 100) * RSI_H;

  return {
    bars,
    priceTicks,
    timeTicks,
    bbUpper: linePath(bands.upper, xAt, yAt),
    bbLower: linePath(bands.lower, xAt, yAt),
    smaPath: linePath(smaSeries, xAt, yAt),
    rsiPath: linePath(rsiSeries, xAt, rsiY),
  };
}

function isNum(v: number | null): v is number {
  return v !== null;
}

/**
 * Builds an SVG path, starting a fresh sub-path after any gap. A series whose
 * leading values are null (indicator warm-up) must not be joined to the first
 * real value by a straight line across the pane.
 */
function linePath(
  series: (number | null)[],
  xAt: (i: number) => number,
  yAt: (v: number) => number,
): string {
  let d = "";
  let penDown = false;

  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (v === null) {
      penDown = false;
      continue;
    }
    const cmd = penDown ? "L" : "M";
    d += `${cmd}${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)} `;
    penDown = true;
  }
  return d.trim();
}

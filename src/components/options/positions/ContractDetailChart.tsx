"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  AreaSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { CHART_COLORS } from "../chart/chartColors";
import type { ContractDetail } from "./contractDetail";
import { AccumulatorBarriersPlugin } from "../chart/plugins/AccumulatorBarriersPlugin";
import { ExitSpotPlugin } from "../chart/plugins/ExitSpotPlugin";
import { TickSpotsPlugin, type TickSpot } from "../chart/plugins/TickSpotsPlugin";

/**
 * Right-panel chart of the Contract Details modal (Deriv §10): a second
 * lightweight-charts instance plotting just this contract's isolated tick
 * path. Each tick is a numbered node; the exit node is green (win) / red
 * (loss); the entry barrier is a dashed horizontal line.
 *
 * Colours are literal hex (CHART_COLORS) — lightweight-charts cannot parse the
 * oklch() values our --opt-* Tailwind tokens resolve to.
 */
export function ContractDetailChart({ detail }: { detail: ContractDetail }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ink = CHART_COLORS.ink;
    const line = CHART_COLORS.line;
    const inkFaint = CHART_COLORS.inkFaint;
    const rise = CHART_COLORS.rise;
    const fall = CHART_COLORS.fall;
    const exitColor = detail.outcome === "won" ? rise : fall;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: inkFaint,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: line, style: 1 },
        horzLines: { color: line, style: 1 },
      },
      rightPriceScale: { borderColor: line },
      timeScale: { borderColor: line, timeVisible: true, secondsVisible: true },
    });

    const series = chart.addSeries(AreaSeries, { 
      lineColor: ink, 
      lineWidth: 2,
      topColor: 'rgba(128, 128, 128, 0.15)',
      bottomColor: 'rgba(128, 128, 128, 0)'
    });
    const chartData: any[] = detail.ticks.map((t) => ({ time: t.time as UTCTimestamp, value: t.value }));

    if (detail.expiryTime && detail.expiryTime > detail.exitTime) {
      const lastTime = detail.ticks.length > 0 ? detail.ticks[detail.ticks.length - 1].time : detail.exitTime;
      for (let t = lastTime + 1; t <= detail.expiryTime; t++) {
        chartData.push({ time: t as UTCTimestamp });
      }
    }
    
    // Add forward whitespace for open tick contracts to prevent x-axis squishing
    const hasExit = detail.ticks.some((t) => t.kind === "exit");
    if (!hasExit && detail.ticks.length > 0) {
      const match = detail.duration.match(/(\d+)\/(\d+)\s+ticks?/i);
      let missingTicks = 0;
      if (match) {
        missingTicks = parseInt(match[2], 10) - parseInt(match[1], 10);
      } else if (detail.duration.includes("tick")) {
        const totalMatch = detail.duration.match(/(\d+)\s+ticks?/i);
        if (totalMatch) {
            missingTicks = Math.max(0, parseInt(totalMatch[1], 10) - detail.ticks.length + 1);
        }
      }
      // Guarantee at least 1 tick of forward space if it's open, to keep the crosshair looking alive
      missingTicks = Math.max(1, missingTicks);
      
      const lastTime = detail.ticks[detail.ticks.length - 1].time;
      for (let i = 1; i <= missingTicks; i++) {
        chartData.push({ time: (lastTime + i) as UTCTimestamp });
      }
    }

    series.setData(chartData);

    // Entry barrier line (dashed) for contracts that have a distinct fixed barrier
    const isDigitContract = detail.type === "even_odd" || detail.type === "DIGITEVEN" || detail.type === "DIGITODD" || detail.type === "matches_differs" || detail.type === "over_under";
    if (detail.type !== "accumulators" && detail.type !== "multipliers" && !isDigitContract) {
      series.createPriceLine({
        price: detail.barrier,
        color: fall,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Barrier",
      });
    }

    // Circled unicode digits ①–⑩ so the number appears inside a circle like Deriv.
    // Add Accumulator specific barriers (red/green shaded box for the final tick)
    if (detail.type === "accumulators" || detail.type === "ACCU") {
      if (detail.ticks.length >= 2) {
        const exitTick = detail.ticks[detail.ticks.length - 1];
        const prevTick = detail.ticks[detail.ticks.length - 2];
        const isWon = detail.outcome === "won";
        
        let highBarrier = detail.highBarrier;
        let lowBarrier = detail.lowBarrier;
        
        if (!highBarrier || !lowBarrier) {
            // Estimate barrier visually if not provided by backend
            if (!isWon) {
                // If lost, the exit spot breached the barrier.
                const diff = Math.abs(exitTick.value - prevTick.value) * 0.95;
                highBarrier = prevTick.value + diff;
                lowBarrier = prevTick.value - diff;
            } else {
                // If won, just show a visually pleasing width
                const diff = prevTick.value * 0.00035; // typical for R_100 5%
                highBarrier = prevTick.value + diff;
                lowBarrier = prevTick.value - diff;
            }
        }
        
        const barriersPlugin = new AccumulatorBarriersPlugin(
            prevTick.time as UTCTimestamp,
            highBarrier,
            lowBarrier,
            isWon
        );
        series.attachPrimitive(barriersPlugin);
      }
    }

    const isMultiplier = detail.tradeTypeLabel.toLowerCase().includes("multiplier") || detail.type === "multipliers" || detail.type === "MULTUP" || detail.type === "MULTDOWN";
    const isTickContract = detail.duration.includes("tick") && !isMultiplier;

    const tickSpots: TickSpot[] = [];
    let tickNumber = 0;
    detail.ticks.forEach((t, i) => {
      // Format timestamp as HH:MM:SS for the label
      const date = new Date(t.time * 1000);
      const hh = String(date.getUTCHours()).padStart(2, "0");
      const mm = String(date.getUTCMinutes()).padStart(2, "0");
      const ss = String(date.getUTCSeconds()).padStart(2, "0");
      const timeLabel = `${hh}:${mm}:${ss}`;

      // kind="entry" = hollow white circle (start point OR entry spot) — never numbered
      // kind="exit"  = exit bubble (numbered as tickNumber+1)
      // kind="normal" = numbered bubble
      if (t.kind === "pre-start") return;

      const isEntry = t.kind === "entry";
      const isExit = t.kind === "exit";

      // Only show markers for entry, exit, or all ticks if it's a tick contract
      if (isEntry || isExit || isTickContract) {
        if (isExit) {
          // Use our custom plugin for the exact Deriv exit spot look
          const exitPlugin = new ExitSpotPlugin(
            t.time as UTCTimestamp,
            t.value,
            timeLabel,
            t.value.toFixed(Math.abs(t.value) < 10 ? 4 : 2),
            detail.outcome === "won",
            isTickContract,
            isTickContract ? tickNumber + 1 : undefined
          );
          series.attachPrimitive(exitPlugin);
        } else if (isEntry) {
          // Entry circles (start point and entry spot) rendered as hollow circles — no number
          tickSpots.push({
            time: t.time as UTCTimestamp,
            price: t.value,
            label: "0",
            isEntry: true
          });
        } else {
          // Normal numbered tick bubble
          tickNumber++;
          tickSpots.push({
            time: t.time as UTCTimestamp,
            price: t.value,
            label: String(tickNumber),
            isEntry: false
          });
        }
      }
    });
    
    if (tickSpots.length > 0) {
      series.attachPrimitive(new TickSpotsPlugin(tickSpots));
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect;
      if (width > 0 && height > 0) chart.resize(width, height);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [detail]);

  return <div ref={containerRef} className="h-full w-full" />;
}



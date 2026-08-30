"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AreaChartIcon, CandleChartIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import {
  CHART_TYPES,
  INTERVALS,
  type ChartTypeId,
  type IntervalId,
} from "./chartSettings";
import { useChartIndicators } from "@/stores/useChartIndicators";
import { INDICATOR_LIST } from "./IndicatorsModal";

const TEAL = "#00A79E";

interface ChartTypesModalProps {
  symbol: string;
  chartType: ChartTypeId;
  interval: IntervalId;
  /** When true (digit trade types), only "1 tick" is enabled (§4.2.2). */
  tickOnly: boolean;
  onSelectChartType: (id: ChartTypeId) => void;
  onSelectInterval: (id: IntervalId) => void;
  onClose: () => void;
}

/**
 * "Chart types" + "Time interval" centered modal (Deriv §4.2). Triggered by
 * the "1T" toolbar icon. Chart-type tiles are radio-style (teal border on the
 * active one); the interval grid shows the active option with a black border
 * and greys out trade-type-restricted options. The "Smooth chart movement"
 * toggle is local UI state (chart perf wiring comes later).
 */
export function ChartTypesModal({
  symbol,
  chartType,
  interval,
  tickOnly,
  onSelectChartType,
  onSelectInterval,
  onClose,
}: ChartTypesModalProps) {
  const [smooth, setSmooth] = useState(true);
  
  const { indicators, removeIndicator } = useChartIndicators();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingInterval, setPendingInterval] = useState<IntervalId | null>(null);
  const [incompatibleList, setIncompatibleList] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chart types"
    >
      <div
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-[min(460px,calc(100vw-32px))] flex-col overflow-hidden rounded-md border border-opt-line bg-opt-bg-elev shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-opt-line px-5 py-4">
          <h2 className="text-[16px] font-bold text-opt-ink">Chart types</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-opt-ink-3 transition-colors hover:bg-opt-bg-sunk hover:text-opt-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* Section 1 — Chart types */}
          <div className="grid grid-cols-4 gap-2.5">
            {CHART_TYPES.map((type) => {
              const active = chartType === type.id;
              const disabled = interval === "1t" && type.id !== "area";
              return (
                <div key={type.id} className="relative group">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onSelectChartType(type.id)}
                    aria-pressed={active}
                    style={
                      active
                        ? {
                            borderColor: TEAL,
                            backgroundColor: "rgba(0,167,158,0.10)",
                            color: TEAL,
                          }
                        : undefined
                    }
                    className={cn(
                      "flex w-full flex-col items-center gap-2 rounded-md border px-2 py-3 transition-colors",
                      disabled
                        ? "cursor-not-allowed border-opt-line bg-opt-bg-sunk text-opt-ink-4 opacity-50"
                        : !active &&
                          "border-opt-line text-opt-ink hover:border-opt-line-strong",
                    )}
                  >
                    <ChartTypeGlyph id={type.id} />
                    <span className="text-[12px] font-medium">{type.label}</span>
                  </button>
                  {disabled && (
                    <div className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 mb-1 hidden w-max -translate-x-1/2 rounded bg-opt-bg-sunk px-2 py-1 text-[11px] font-medium text-opt-ink shadow-sm border border-opt-line group-hover:block pointer-events-none">
                      Available only for non-tick time intervals.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <h2 className="mb-4 text-[14px] font-bold text-opt-ink">Time interval</h2>
            {/* Section 2 - Time interval */}
            <div className="grid grid-cols-4 gap-2">
              {INTERVALS.map((opt) => {
                const active = interval === opt.id;
                const disabled = (tickOnly && opt.id !== "1t") || (chartType !== "area" && opt.id === "1t");
                let tooltipMsg = "";
                if (tickOnly && opt.id !== "1t") tooltipMsg = "Available only for non-tick trade types.";
                if (chartType !== "area" && opt.id === "1t") tooltipMsg = "Available only for Area chart type.";
                return (
                  <div key={opt.id} className="relative group">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        if (opt.id === "1t") {
                          const active = indicators.filter(i => i.symbol === symbol);
                          const incompatible = active.filter(ind => {
                            const meta = INDICATOR_LIST.find(m => m.id === ind.type);
                            return meta?.requiresOHLC;
                          });
                          if (incompatible.length > 0) {
                            setIncompatibleList(incompatible.map(i => i.id));
                            setPendingInterval(opt.id);
                            setShowWarning(true);
                            return;
                          }
                        }
                        onSelectInterval(opt.id);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "w-full rounded-md border px-1.5 py-2 text-[12px] font-medium transition-colors",
                        disabled
                          ? "cursor-not-allowed border-opt-line bg-opt-bg-sunk text-opt-ink-4 opacity-50"
                          : active
                            ? "border-opt-ink text-opt-ink"
                            : "border-opt-line text-opt-ink-2 hover:border-opt-line-strong hover:text-opt-ink",
                      )}
                    >
                      {opt.label}
                    </button>
                    {disabled && (
                      <div className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 mb-1 hidden w-max -translate-x-1/2 rounded bg-opt-bg-sunk px-2 py-1 text-[11px] font-medium text-opt-ink shadow-sm border border-opt-line group-hover:block pointer-events-none">
                        {tooltipMsg}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3 — Smooth chart movement toggle */}
          <div className="flex items-center justify-between gap-3 border-t border-opt-line pt-4">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-opt-ink">
                Smooth chart movement
              </span>
              <span className="text-[11px] leading-snug text-opt-ink-3">
                Performance may vary by device. Turn off if it lags.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smooth}
              aria-label="Smooth chart movement"
              onClick={() => setSmooth((v) => !v)}
              style={smooth ? { backgroundColor: TEAL } : undefined}
              className={cn(
                "relative h-[22px] w-[40px] flex-shrink-0 rounded-full transition-colors",
                !smooth && "bg-opt-line-strong",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-[2px] top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform",
                  smooth && "translate-x-[18px]",
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer notice */}
        <div className="bg-opt-bg-sunk px-5 py-3 text-[11px] leading-snug text-opt-ink-3">
          Only selected charts and time intervals are available for this trade
          type.
        </div>
      </div>
      
      {showWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowWarning(false)} />
          <div className="relative flex w-[400px] flex-col rounded-lg bg-white shadow-2xl p-6">
            <h2 className="text-[16px] font-bold text-[#333333]">Are you sure?</h2>
            <p className="text-[14px] leading-relaxed text-[#333333] mt-4 mb-6">
              Some of your active indicators don't support 1-tick intervals. If you change to a 1-tick interval, these indicators will be removed from your chart.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="rounded border border-[#999999] bg-[#f2f3f4] px-4 py-2 text-[14px] font-bold text-[#333333] hover:bg-[#e6e9ed] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  incompatibleList.forEach(id => removeIndicator(id));
                  if (pendingInterval) onSelectInterval(pendingInterval);
                  setShowWarning(false);
                }}
                className="rounded bg-[#ff444f] px-4 py-2 text-[14px] font-bold text-white hover:bg-[#eb3e48] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartTypeGlyph({ id }: { id: ChartTypeId }) {
  switch (id) {
    case "area":
      return <AreaChartIcon className="h-5 w-5" />;
    case "candle":
      return <CandleChartIcon className="h-5 w-5" />;
    case "hollow":
      return <HollowGlyph />;
    case "ohlc":
      return <OhlcGlyph />;
  }
}

function HollowGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <g stroke="#00a79e">
        <path d="M7 4v3M7 17v3" />
        <rect x="5" y="7" width="4" height="10" rx="0.5" />
      </g>
      <g stroke="#e91e63">
        <path d="M17 4v5M17 19v1" />
        <rect x="15" y="9" width="4" height="10" rx="0.5" />
      </g>
    </svg>
  );
}

function OhlcGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path stroke="#00a79e" d="M8 5v14M4 9h4M8 13h-4" />
      <path stroke="#e91e63" d="M16 7v12M16 10h4M12 16h4" />
    </svg>
  );
}

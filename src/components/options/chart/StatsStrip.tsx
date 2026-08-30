"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

interface StatsStripProps {
  /**
   * Recent run-lengths (Deriv "Accumulators" stat — how many consecutive ticks
   * the price stayed in the no-touch barrier). First entry is the current /
   * latest run.
   */
  runs?: number[];
}

/**
 * The "Stats" strip that lives between the chart and the GMT footer when
 * the Accumulators contract type is active.
 *
 * Owns a tiny local state for the collapsed flag — the chart isn't affected
 * by it, so the chart canvas doesn't re-render when you toggle visibility.
 */
export function StatsStrip({ runs = [] }: StatsStripProps) {
  const [open, setOpen] = useState(false);

  // Strip shows up to 10 recent runs
  const stripRuns = runs.slice(0, 10);

  return (
    <div className="relative inline-flex items-center gap-4 px-4 py-2 text-[12px] bg-opt-bg-elev rounded-lg shadow-md border border-opt-line">
      <span className="font-medium text-opt-ink-2 underline decoration-dashed decoration-opt-ink-3/60 underline-offset-[4px]">
        Stats
      </span>

      <div className="flex items-center gap-[18px] overflow-hidden font-mono text-opt-ink-2">
        {stripRuns.map((n, i) => (
          <span
            key={i}
            className={cn(
              "tabular-nums leading-none",
              i === 0
                ? "font-bold text-opt-ink border-b-2 border-[#00a79e] pb-[3px]"
                : "font-medium"
            )}
          >
            {n}
          </span>
        ))}
      </div>

      <button
        type="button"
        aria-label={open ? "Hide stats" : "Show stats"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-md border-0 bg-transparent text-opt-ink-3",
          "hover:bg-opt-surface-2 hover:text-opt-ink transition-colors",
        )}
      >
        {open ? (
          <CaretDownIcon className="h-3.5 w-3.5" />
        ) : (
          <CaretUpIcon className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Popover Grid */}
      {open && runs.length > 0 && (
        <div className="absolute bottom-full left-0 mb-3 z-50 w-[420px] rounded-lg bg-opt-bg-elev p-4 text-opt-ink shadow-xl border border-opt-line">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-[12px] text-opt-ink-2 underline decoration-opt-ink-3/60 underline-offset-[4px]">
              Stats
            </span>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-opt-ink-2 cursor-pointer hover:text-opt-ink" onClick={() => setOpen(false)}>
              History of tick counts <CaretDownIcon className="h-3 w-3" />
            </div>
          </div>
          <div className="grid grid-cols-10 gap-y-4 gap-x-2 text-center font-mono text-[12px] tabular-nums text-opt-ink-2">
            {runs.slice(0, 100).map((n, i) => (
              <span key={i} className={i === 0 ? "font-bold text-opt-ink" : ""}>
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

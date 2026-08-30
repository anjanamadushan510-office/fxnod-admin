"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CaretDownIcon, InfoIcon, PlusIcon } from "@/components/ui/Icons";
import type { BotIndicator, BotIndicatorKind } from "@/services/api/model";
import { INDICATORS, indicatorMeta } from "./botMeta";

interface IndicatorPickerProps {
  value: BotIndicator[];
  onChange: (next: BotIndicator[]) => void;
  disabled?: boolean;
}

/**
 * Add / remove the indicators a run uses.
 *
 * Indicators are per-RUN configuration, not per-bot: any bot can be given any
 * of them, and adding a directional one is what unlocks "auto" direction. The
 * engine treats the list the same way, so this is a thin editor over what gets
 * POSTed — no hidden defaults live here.
 */
export function IndicatorPicker({
  value,
  onChange,
  disabled = false,
}: IndicatorPickerProps) {
  const [open, setOpen] = useState(false);

  const used = new Set(value.map((i) => i.kind));
  const available = INDICATORS.filter((i) => !used.has(i.kind));

  function add(kind: BotIndicatorKind) {
    const meta = indicatorMeta(kind);
    // Period is sent explicitly rather than left blank so the run records what
    // it actually used — a run whose audit trail says "RSI" with no period
    // cannot be replayed.
    const next: BotIndicator = meta.defaultPeriod
      ? { kind, period: meta.defaultPeriod }
      : { kind };
    onChange([...value, next]);
    setOpen(false);
  }

  function remove(kind: BotIndicatorKind) {
    onChange(value.filter((i) => i.kind !== kind));
  }

  function setPeriod(kind: BotIndicatorKind, period: number) {
    onChange(value.map((i) => (i.kind === kind ? { ...i, period } : i)));
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <h3 className="m-0 text-[13px] font-bold tracking-[-0.01em] text-opt-ink">
          Indicators
        </h3>
        <InfoIcon className="h-3.5 w-3.5 text-opt-ink-4" />
      </div>

      {value.length === 0 ? (
        <p className="m-0 text-[11px] leading-relaxed text-opt-ink-3">
          No indicators — the bot trades on every tick signal. Add one to unlock
          the <b className="font-semibold">Auto</b> direction.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {value.map((indicator) => {
            const meta = indicatorMeta(indicator.kind);
            return (
              <li
                key={indicator.kind}
                className="flex items-center gap-2 rounded-[var(--opt-radius-sm)] border border-opt-line bg-opt-bg-elev px-2.5 py-2"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-opt-ink">
                    {meta.label}
                    {!meta.directional && (
                      <span className="rounded bg-opt-bg-sunk px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-opt-ink-3">
                        Filter
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[10px] text-opt-ink-3">
                    {meta.hint}
                  </span>
                </span>

                {meta.defaultPeriod !== undefined && (
                  <input
                    type="number"
                    min={2}
                    max={200}
                    aria-label={`${meta.label} period`}
                    value={indicator.period ?? meta.defaultPeriod}
                    disabled={disabled}
                    onChange={(e) => {
                      const n = Number.parseInt(e.target.value, 10);
                      setPeriod(indicator.kind, Number.isFinite(n) ? n : meta.defaultPeriod!);
                    }}
                    className={cn(
                      "h-7 w-14 shrink-0 rounded-[var(--opt-radius-sm)] border border-opt-line",
                      "bg-opt-bg px-1.5 text-right text-[11px] tabular-nums text-opt-ink",
                      "outline-none disabled:opacity-55",
                    )}
                  />
                )}

                <button
                  type="button"
                  aria-label={`Remove ${meta.label}`}
                  disabled={disabled}
                  onClick={() => remove(indicator.kind)}
                  className="shrink-0 px-1 text-[15px] leading-none text-opt-ink-3 transition-colors hover:text-opt-fall disabled:opacity-55"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled || available.length === 0}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-[var(--opt-radius-sm)]",
            "border border-dashed border-opt-line-strong bg-opt-bg px-2.5 py-2",
            "text-[12px] font-semibold text-opt-ink-2 transition-colors",
            "hover:border-opt-rise hover:text-opt-rise disabled:opacity-45 disabled:hover:border-opt-line-strong",
          )}
        >
          <PlusIcon className="h-3 w-3" />
          {available.length === 0 ? "All indicators added" : "Add indicator"}
          {available.length > 0 && <CaretDownIcon className="h-3 w-3" />}
        </button>

        {open && available.length > 0 && (
          <div
            role="listbox"
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+4px)] z-20 flex flex-col",
              "overflow-hidden rounded-[var(--opt-radius)] border border-opt-line",
              "bg-opt-bg-elev shadow-lg",
            )}
          >
            {available.map((meta) => (
              <button
                key={meta.kind}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => add(meta.kind)}
                className="flex flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-opt-bg-sunk"
              >
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-opt-ink">
                  {meta.label}
                  {!meta.directional && (
                    <span className="rounded bg-opt-bg-sunk px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-opt-ink-3">
                      Filter
                    </span>
                  )}
                </span>
                <span className="text-[10px] leading-snug text-opt-ink-3">
                  {meta.hint}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Whether the configured list can drive "auto" direction.
 *
 * Mirrors marketdata.HasDirectional. The backend rejects an auto run without
 * one; checking here only avoids offering an option that would fail.
 */
export function hasDirectionalIndicator(indicators: BotIndicator[]): boolean {
  return indicators.some((i) => indicatorMeta(i.kind).directional);
}

"use client";

import { cn } from "@/lib/cn";
import type { BotStrategy } from "@/services/api/model";

interface BotPickerProps {
  strategies: BotStrategy[];
  onSelect: (strategyId: string) => void;
  /** Active runs per strategy_id, so a bot already working says so. */
  runningCounts: Record<string, number>;
  loading?: boolean;
}

/**
 * The screen a tab shows before it is a bot.
 *
 * Choosing a bot used to be a list in the configuration rail, which meant every
 * tab carried a permanent control for something decided once — and made the
 * choice feel reversible when it is not: a run's strategy is snapshotted
 * server-side at start and cannot be swapped underneath it.
 *
 * So it becomes a step instead. An empty tab shows this; picking turns the tab
 * into that bot's workspace, the way a browser's new-tab page turns into a
 * page. The rail then holds only what the user actually keeps adjusting.
 */
export function BotPicker({
  strategies,
  onSelect,
  runningCounts,
  loading = false,
}: BotPickerProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-[980px]">
        <header className="mb-6">
          <h1 className="m-0 text-[20px] font-bold tracking-tight text-opt-ink">
            Choose a bot
          </h1>
          <p className="m-0 mt-1 max-w-[62ch] text-[12px] leading-relaxed text-opt-ink-3">
            Each bot trades one Deriv contract type. Pick one to configure it in
            this tab — you can open more tabs and run several at once, on the
            same account.
          </p>
        </header>

        {loading && <SkeletonGrid />}

        {!loading && strategies.length === 0 && (
          <p className="m-0 text-[12px] text-opt-ink-3">
            No bots available. The trading engine may be unavailable.
          </p>
        )}

        {!loading && strategies.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((s) => (
              <BotCard
                key={s.strategy_id}
                strategy={s}
                running={runningCounts[s.strategy_id] ?? 0}
                onSelect={() => onSelect(s.strategy_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BotCard({
  strategy,
  running,
  onSelect,
}: {
  strategy: BotStrategy;
  running: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex h-full flex-col items-start gap-2 rounded-[var(--opt-radius)] border p-4 text-left",
        "border-opt-line bg-opt-bg-elev transition-colors",
        "hover:border-opt-rise focus-visible:outline focus-visible:outline-2 focus-visible:outline-opt-rise",
      )}
    >
      <div className="flex w-full items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-opt-bg-sunk text-[14px] font-bold text-opt-ink-2 transition-colors group-hover:bg-opt-rise group-hover:text-white"
        >
          {strategy.display_name.charAt(0)}
        </span>

        <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-opt-ink">
          {strategy.display_name}
        </span>

        {running > 0 && (
          <span className="shrink-0 rounded-full bg-opt-rise-soft px-2 py-0.5 text-[10px] font-bold text-opt-rise">
            {running} running
          </span>
        )}
      </div>

      {strategy.description && (
        <p className="m-0 line-clamp-3 text-[11.5px] leading-relaxed text-opt-ink-3">
          {strategy.description}
        </p>
      )}

      <span className="mt-auto pt-1 text-[10px] font-semibold uppercase tracking-wide text-opt-ink-4">
        {strategy.supported_contract_types.join(" · ")}
      </span>
    </button>
  );
}

/**
 * Placeholder cards while the list loads. Deliberately shapes, not numbers:
 * the count is unknown until the engine answers, and inventing eight boxes that
 * turn into six is a worse flicker than a short empty grid.
 */
function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[116px] animate-pulse rounded-[var(--opt-radius)] border border-opt-line bg-opt-bg-elev"
        />
      ))}
    </div>
  );
}

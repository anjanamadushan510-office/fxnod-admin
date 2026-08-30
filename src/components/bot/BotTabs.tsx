"use client";

import { cn } from "@/lib/cn";
import { PlusIcon } from "@/components/ui/Icons";
import type { BotRun } from "@/services/api/model";

/**
 * Tabs across the top of dBot, one per bot.
 *
 * The important design decision: a tab representing a RUNNING bot is not browser
 * state. It is a view of a row the server owns. Closing such a tab must not stop
 * the bot, and the bot must reappear on another device or after a refresh —
 * because it is genuinely still running on the worker.
 *
 * So tabs come in two kinds:
 *
 *   live   backed by an active bot_run. Derived from the server on every poll,
 *          survives refresh, cannot be closed (only stopped).
 *   draft  a configuration being written that has not been started. Purely
 *          local, closeable, disappears on refresh — nothing is at stake in it.
 *
 * Conflating the two is the trap: a "close tab" that silently killed a live bot,
 * or one that silently left it running while removing the only way to see it,
 * are both worse than not having tabs.
 */

export interface DraftTab {
  /** Local-only id. */
  id: string;
  label: string;
  /** Second line. An empty tab says what it is still waiting for. */
  sub: string;
}

interface BotTabsProps {
  /** Active runs from the server, newest first. */
  runs: BotRun[];
  drafts: DraftTab[];
  /** Either a run_id or a draft id. */
  activeId: string;
  onSelect: (id: string) => void;
  onCloseDraft: (id: string) => void;
  onNewDraft: () => void;
  /** From /bots/limits — how many bots this user may run at once. */
  maxConcurrent: number;
  /** Names for strategy ids, so a tab reads "Accumulator" not "accumulator". */
  strategyNames: Record<string, string>;
}

export function BotTabs({
  runs,
  drafts,
  activeId,
  onSelect,
  onCloseDraft,
  onNewDraft,
  maxConcurrent,
  strategyNames,
}: BotTabsProps) {
  // A draft can only become a run if there is room, so the button reflects the
  // server's cap rather than letting the user build a config that will be
  // refused on Start.
  const atCapacity = runs.length >= maxConcurrent;

  return (
    <div
      role="tablist"
      aria-label="Bots"
      className="flex shrink-0 items-end gap-1 overflow-x-auto border-b border-opt-line bg-opt-bg-sunk px-2 pt-1.5"
    >
      {runs.map((run) => (
        <Tab
          key={run.run_id}
          id={run.run_id}
          label={strategyNames[run.strategy_id] ?? run.strategy_id}
          sub={run.symbol}
          active={activeId === run.run_id}
          status={run.status}
          onSelect={onSelect}
        />
      ))}

      {drafts.map((draft) => (
        <Tab
          key={draft.id}
          id={draft.id}
          label={draft.label}
          sub={draft.sub}
          active={activeId === draft.id}
          onSelect={onSelect}
          onClose={onCloseDraft}
        />
      ))}

      <button
        type="button"
        onClick={onNewDraft}
        disabled={atCapacity && drafts.length > 0}
        title={
          atCapacity
            ? `You can run ${maxConcurrent} bots at once. Stop one to start another.`
            : "Configure another bot"
        }
        className={cn(
          "mb-1 ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-md",
          "text-opt-ink-3 transition-colors hover:bg-opt-bg-elev hover:text-opt-ink",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
        aria-label="Add a bot"
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>

      {atCapacity && (
        <span className="mb-2 ml-2 shrink-0 text-[10px] text-opt-ink-3">
          {maxConcurrent} of {maxConcurrent} running
        </span>
      )}
    </div>
  );
}

function Tab({
  id,
  label,
  sub,
  active,
  status,
  onSelect,
  onClose,
}: {
  id: string;
  label: string;
  sub?: string;
  active: boolean;
  status?: string;
  onSelect: (id: string) => void;
  onClose?: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-3 py-1.5",
        active
          ? "border-opt-line bg-opt-bg-elev"
          : "border-transparent bg-transparent hover:bg-opt-bg-elev/60",
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => onSelect(id)}
        className="flex items-center gap-2 text-left"
      >
        {status && <StatusDot status={status} />}
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "max-w-[130px] truncate text-[12px] font-semibold",
              active ? "text-opt-ink" : "text-opt-ink-2",
            )}
          >
            {label}
          </span>
          {sub && (
            <span className="max-w-[130px] truncate text-[10px] text-opt-ink-3">
              {sub}
            </span>
          )}
        </span>
      </button>

      {/* Only DRAFTS get a close button. A live bot is stopped, not closed —
          closing it would either kill a running bot from a UI affordance that
          reads as "hide", or hide it while it keeps trading. */}
      {onClose && (
        <button
          type="button"
          onClick={() => onClose(id)}
          aria-label={`Close ${label}`}
          className={cn(
            "grid h-4 w-4 shrink-0 place-items-center rounded text-[13px] leading-none",
            "text-opt-ink-4 opacity-0 transition-opacity hover:bg-opt-bg-sunk hover:text-opt-fall",
            "group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          ×
        </button>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const tone =
    status === "running" || status === "pending"
      ? "bg-opt-rise"
      : status === "paused"
        ? "bg-opt-ink-3"
        : status === "stopping"
          ? "bg-opt-fall"
          : "bg-opt-ink-4";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        tone,
        // Only a genuinely live bot pulses. A paused or stopping one animating
        // would say "working" when it is not.
        (status === "running" || status === "pending") && "animate-pulse",
      )}
    />
  );
}

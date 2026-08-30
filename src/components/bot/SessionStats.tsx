"use client";

import { cn } from "@/lib/cn";
import { InfoIcon } from "@/components/ui/Icons";
import { winRate, type BotSession, type BotStatus } from "./types";

/** Formats an amount with a forced sign — a P&L of exactly 0 reads as "0.00". */
function signed(value: number): string {
  const body = Math.abs(value).toFixed(2);
  if (value > 0) return `+${body}`;
  if (value < 0) return `-${body}`;
  return body;
}

interface SessionStatsProps {
  session: BotSession;
  /** Aggregate realised P&L across ALL the user's active bots. */
  accountPnl?: number;
  /** The platform's account-wide loss ceiling. */
  accountLossLimit?: number;
  /** How many bots are running. Above one, the account row is what matters. */
  activeRuns?: number;
}

/**
 * One compact strip: P&L, status, the two session meters and the counters.
 *
 * Previously two stacked rows of tall cards that took a third of the viewport
 * for eight numbers. A trader watching a bot needs the chart and the trade list;
 * the numbers are a glance, not the subject. Same information, one row, roughly a
 * third of the height.
 */
export function SessionStats({
  session,
  accountPnl,
  accountLossLimit,
  activeRuns = 1,
}: SessionStatsProps) {
  const positive = session.realizedPnl >= 0;
  const multiBot = activeRuns > 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-stretch gap-x-6 gap-y-3 rounded-[var(--opt-radius)] border border-opt-line bg-opt-bg-elev px-4 py-2.5">
        {/* Headline P&L — the only figure given size, because it is the one
            being watched. */}
        <div className="flex min-w-[140px] flex-col justify-center">
          <Label text="Realized P&L" info />
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-[22px] font-bold leading-none tabular-nums",
                positive ? "text-opt-rise" : "text-opt-fall",
              )}
            >
              {signed(session.realizedPnl)}
            </span>
            <span className="text-[11px] font-semibold text-opt-ink-3">
              {session.currency}
            </span>
            <span
              className={cn(
                "ml-0.5 text-[10px] font-semibold tabular-nums",
                positive ? "text-opt-rise" : "text-opt-fall",
              )}
            >
              {signed(session.realizedPnlPct)}%
            </span>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col justify-center">
          <Label text="Status" />
          <StatusPill status={session.status} />
        </div>

        <Divider />

        <Meter
          label="Target Profit"
          tone="rise"
          progress={session.targetProfitProgress}
          limit={session.targetProfitLimit}
          currency={session.currency}
        />

        <Meter
          label="Stop Loss"
          tone="fall"
          progress={session.stopLossProgress}
          limit={session.stopLossLimit}
          currency={session.currency}
        />

        <Divider />

        <Counter label="Trades" value={String(session.tradesTotal)} />
        <Counter label="Won" value={String(session.tradesWon)} tone="rise" />
        <Counter label="Loss" value={String(session.tradesLost)} tone="fall" />
        <Counter label="Win %" value={`${winRate(session).toFixed(1)}%`} />
      </div>

      {/* With more than one bot running, THIS is the number that describes the
          user's exposure — each bot's own stop loss only bounds that bot. Shown
          only when it is actually load-bearing, so a single-bot session is not
          cluttered with a row that says the same thing twice. */}
      {multiBot && accountLossLimit !== undefined && accountPnl !== undefined && (
        <AccountExposure
          pnl={accountPnl}
          limit={accountLossLimit}
          runs={activeRuns}
          currency={session.currency}
        />
      )}
    </div>
  );
}

function AccountExposure({
  pnl,
  limit,
  runs,
  currency,
}: {
  pnl: number;
  limit: number;
  runs: number;
  currency: string;
}) {
  const used = Math.max(0, -pnl);
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  // Warn before it bites: a trader who only finds out at 100% has already lost
  // the money.
  const near = pct >= 75;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[var(--opt-radius)] border px-4 py-2",
        near
          ? "border-opt-fall/40 bg-opt-fall-soft"
          : "border-opt-line bg-opt-bg-elev",
      )}
    >
      <span className="text-[11px] font-semibold text-opt-ink-2">
        All {runs} bots
      </span>

      <span
        className={cn(
          "text-[13px] font-bold tabular-nums",
          pnl >= 0 ? "text-opt-rise" : "text-opt-fall",
        )}
      >
        {signed(pnl)} {currency}
      </span>

      <div className="flex min-w-[120px] flex-1 items-center gap-2">
        <div
          role="progressbar"
          aria-label="Account loss limit used"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-opt-bg-sunk"
        >
          <div
            className={cn("h-full rounded-full transition-[width] duration-300",
              near ? "bg-opt-fall" : "bg-opt-ink-4")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-opt-ink-3">
          {used.toFixed(2)} / {limit.toFixed(2)} account limit
        </span>
      </div>

      <span className="text-[10px] leading-snug text-opt-ink-3">
        Each bot also has its own stop loss. This is the total across them.
      </span>
    </div>
  );
}

// ─── primitives ──────────────────────────────────────────────────────────────

function Divider() {
  return <div aria-hidden="true" className="w-px shrink-0 self-stretch bg-opt-line" />;
}

function Label({ text, info }: { text: string; info?: boolean }) {
  return (
    <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-opt-ink-3">
      {text}
      {info && <InfoIcon className="h-2.5 w-2.5 text-opt-ink-4" />}
    </span>
  );
}

function Meter({
  label,
  tone,
  progress,
  limit,
  currency,
}: {
  label: string;
  tone: "rise" | "fall";
  progress: number;
  limit: number;
  currency: string;
}) {
  // Clamped so a backend reporting an overshoot cannot draw past its track.
  const pct = limit > 0 ? Math.min(100, Math.max(0, (progress / limit) * 100)) : 0;

  return (
    <div className="flex min-w-[132px] flex-col justify-center gap-1">
      <Label text={label} />
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[13px] font-bold leading-none tabular-nums",
            tone === "rise" ? "text-opt-rise" : "text-opt-fall",
          )}
        >
          {pct.toFixed(0)}%
        </span>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 flex-1 overflow-hidden rounded-full bg-opt-bg-sunk"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              tone === "rise" ? "bg-opt-rise" : "bg-opt-fall",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] tabular-nums text-opt-ink-3">
        {progress.toFixed(2)} / {limit.toFixed(2)} {currency}
      </span>
    </div>
  );
}

const STATUS_COPY: Record<BotStatus, { label: string; className: string; dot: string }> = {
  idle: {
    label: "Idle",
    className: "border-opt-line bg-opt-bg-sunk text-opt-ink-2",
    dot: "bg-opt-ink-4",
  },
  running: {
    label: "Running",
    className: "border-opt-rise/30 bg-opt-rise-soft text-opt-rise",
    dot: "bg-opt-rise",
  },
  paused: {
    label: "Paused",
    className: "border-opt-line-strong bg-opt-bg-sunk text-opt-ink-2",
    dot: "bg-opt-ink-3",
  },
  stopping: {
    label: "Stopping…",
    className: "border-opt-fall/30 bg-opt-fall-soft text-opt-fall",
    dot: "bg-opt-fall",
  },
};

export function StatusPill({ status }: { status: BotStatus }) {
  const copy = STATUS_COPY[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        copy.className,
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", copy.dot)} />
      {copy.label}
    </span>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rise" | "fall";
}) {
  return (
    <div className="flex min-w-[52px] flex-col justify-center">
      <Label text={label} />
      <span
        className={cn(
          "text-[15px] font-bold leading-none tabular-nums",
          tone === "rise" && "text-opt-rise",
          tone === "fall" && "text-opt-fall",
          !tone && "text-opt-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

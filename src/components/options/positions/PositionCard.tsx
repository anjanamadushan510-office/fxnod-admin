"use client";

import { memo, useState, useEffect } from "react";
import { BarsIcon, ClockIcon, ExpandIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import type { Position } from "@/hooks/useMockPositions";
import { formatTradeTypeLabel } from "./contractDetail";

interface PositionCardProps {
  position: Position;
  /** Optional: open the contract details page. */
  onOpenDetails?: (id: string) => void;
  /** Optional: sell early (resale offered). When absent → "Resale not offered". */
  onSell?: (id: string) => void;
}



function useCountdown(expiryTime?: number) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!expiryTime) return;
    const i = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(i);
  }, [expiryTime]);
  if (!expiryTime) return null;
  const diff = expiryTime - now;
  return diff > 0 ? diff : 0;
}

/**
 * Open-position card (Deriv §8, Step 4): asset icon + name + expand, then the
 * trade type / stake row, the timer / live-P&L row, and a resale slot
 * ("Resale not offered" unless an `onSell` handler is provided).
 *
 * Memoised because the parent (PositionsDrawer) re-renders every P/L tick —
 * a card only repaints when *its* Position reference changes.
 */
function PositionCardInner({
  position,
  onOpenDetails,
  onSell,
}: PositionCardProps) {
  const pnlPositive = position.pnl >= 0;
  const tradeType = formatTradeTypeLabel(position.contractType, position.side);
  const remain = useCountdown(position.isTick ? undefined : position.expiryTime);
  const statusDisplay = remain != null ? `${remain} secs` : (position.status ?? "—");

  return (
    <article className="flex flex-col gap-2 rounded-[10px] border border-opt-line bg-opt-bg-elev px-3 py-2.5">
      {/* Asset icon + name + expand */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-opt-bg-sunk text-opt-ink-3"
        >
          <BarsIcon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-opt-ink">
          {position.marketName}
        </span>
        <button
          type="button"
          aria-label="Contract details"
          onClick={() => onOpenDetails?.(position.id)}
          className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md text-opt-ink-3 transition-colors hover:bg-opt-bg-sunk hover:text-opt-ink"
        >
          <ExpandIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Trade type + stake */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-opt-ink-2">{tradeType}</span>
        <span className="font-mono font-medium tabular-nums text-opt-ink">
          {position.stake.toFixed(2)} USD
        </span>
      </div>

      {/* Timer/duration + live P&L */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1 text-opt-ink-3">
          <ClockIcon className="h-3.5 w-3.5" />
          {statusDisplay}
        </span>
        <span
          className={cn(
            "font-mono font-bold tabular-nums",
            pnlPositive ? "text-opt-rise" : "text-opt-fall",
          )}
        >
          {pnlPositive ? "+" : ""}
          {position.pnl.toFixed(2)} USD
        </span>
      </div>

      {/* Resale slot */}
      {onSell ? (
        <button
          type="button"
          onClick={() => position.contractId && onSell(position.contractId)}
          className={cn(
            "rounded-md px-3 py-1.5 text-center font-mono text-[12px] font-semibold tabular-nums transition-[filter] hover:brightness-110",
            position.contractType.toLowerCase().includes("mult")
              ? "bg-transparent border border-opt-ink text-opt-ink" // Similar to Deriv's secondary "Close" button
              : "bg-opt-ink text-opt-bg"
          )}
        >
          {position.contractType.toLowerCase().includes("mult") ? (
            "Close"
          ) : (
            <>Sell {position.contractValue.toFixed(2)} USD</>
          )}
        </button>
      ) : (
        <div className="rounded-md bg-opt-bg-sunk px-3 py-1.5 text-center text-[12px] text-opt-ink-4">
          Resale not offered
        </div>
      )}
    </article>
  );
}

export const PositionCard = memo(PositionCardInner);

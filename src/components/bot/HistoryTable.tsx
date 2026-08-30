"use client";

import { cn } from "@/lib/cn";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/Icons";
import type { BotTrade } from "./types";

export function HistoryTable({ trades }: { trades: BotTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="grid flex-1 place-items-center px-5 py-12 text-center">
        <p className="m-0 max-w-[30ch] text-[12px] leading-relaxed text-opt-ink-3">
          No trades yet. Configure a bot and start it to see its trades here.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-10 bg-opt-bg-elev">
          <tr className="border-b border-opt-line text-left">
            <Th>Time</Th>
            <Th>Direction</Th>
            <Th align="right">Stake</Th>
            <Th>Result</Th>
            <Th align="right">P&amp;L</Th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-opt-line/60 last:border-b-0 hover:bg-opt-bg-sunk"
            >
              <Td className="tabular-nums text-opt-ink-2">{trade.time}</Td>
              <Td>
                <DirectionCell direction={trade.direction} />
              </Td>
              <Td align="right" className="tabular-nums text-opt-ink-2">
                {trade.stake.toFixed(2)}
              </Td>
              <Td>
                <ResultCell result={trade.result} />
              </Td>
              <Td align="right">
                <PnlCell pnl={trade.pnl} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DirectionCell({ direction }: { direction: BotTrade["direction"] }) {
  const up = direction === "up";
  const Icon = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        up ? "text-opt-rise" : "text-opt-fall",
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? "Up" : "Down"}
    </span>
  );
}

function ResultCell({ result }: { result: BotTrade["result"] }) {
  if (result === "open") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-opt-ink-3">
        <span aria-hidden="true">↓</span> Open
      </span>
    );
  }
  const won = result === "won";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        won ? "text-opt-rise" : "text-opt-fall",
      )}
    >
      <span aria-hidden="true">{won ? "✓" : "✕"}</span>
      {won ? "Won" : "Loss"}
    </span>
  );
}

function PnlCell({ pnl }: { pnl: number | null }) {
  // An open contract has no realized P&L. Showing 0.00 would read as
  // break-even, which is a different and misleading claim.
  if (pnl === null) {
    return <span className="text-opt-ink-4">--</span>;
  }
  const positive = pnl >= 0;
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        positive ? "text-opt-rise" : "text-opt-fall",
      )}
    >
      {positive ? "+" : "-"}
      {Math.abs(pnl).toFixed(2)}
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-2.5 text-[11px] font-semibold text-opt-ink-3",
        align === "right" && "text-right",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn("px-5 py-2.5", align === "right" && "text-right", className)}
    >
      {children}
    </td>
  );
}

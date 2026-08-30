"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowUpRight, ArrowDownRight, FileText, Clock, Target, Timer, Flag, CircleDot } from "lucide-react";
import { useContractDetails } from "@/stores/useContractDetails";
import { useOpenPositions } from "@/stores/useOpenPositions";
import { cn } from "@/lib/cn";
import { ContractDetailChart } from "./ContractDetailChart";
import {
  formatContractTime,
  simPositionToDetail,
  type ContractDetail,
} from "./contractDetail";

/**
 * Contract Details modal (Deriv §10). Two-column: left metadata panel, right
 * isolated-tick chart. Portals into the `[data-app="options"]` subtree so the
 * scoped theme tokens apply. Driven by the useContractDetails store (opened
 * from a position card's ⇗ expand).
 */
export function ContractDetailsModal() {
  const storeDetail = useContractDetails((s) => s.detail);
  const close = useContractDetails((s) => s.close);
  const openPositions = useOpenPositions((s) => s.positions);
  const [target, setTarget] = useState<Element | null>(null);

  const livePosition = storeDetail 
    ? openPositions.find((p) => String(p.id) === String(storeDetail.id))
    : null;
    
  const detail = livePosition ? simPositionToDetail(livePosition) : storeDetail;

  useEffect(() => {
    setTarget(document.querySelector('[data-app="options"]') ?? document.body);
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail, close]);

  if (!detail || !target) return null;

  const lost = detail.outcome === "lost";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Contract details"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      <div className="relative z-10 flex h-[min(700px,calc(100vh-64px))] w-[min(1200px,calc(100vw-64px))] flex-col overflow-hidden rounded-2xl border border-opt-line bg-opt-bg-elev shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-opt-line px-4 py-3">
          <h2 className="text-[15px] font-bold text-opt-ink">Contract details</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="grid h-8 w-8 place-items-center rounded-lg text-opt-ink-3 transition-colors hover:bg-opt-bg-sunk hover:text-opt-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Body: [left metadata] [right chart] */}
        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
          <LeftPanel detail={detail} lost={lost} />
          <div className="min-h-0 min-w-0 bg-opt-bg p-2">
            <ContractDetailChart detail={detail} />
          </div>
        </div>
      </div>
    </div>,
    target,
  );
}

function LeftPanel({
  detail,
  lost,
}: {
  detail: ContractDetail;
  lost: boolean;
}) {
  const pnlClass = lost ? "text-opt-fall" : "text-opt-rise";
  const dp = Math.abs(detail.entrySpot) < 10 ? 4 : 2;

  let mainName = detail.marketName;
  let subName = "";
  const parenIdx = detail.marketName.indexOf("(");
  if (parenIdx > 0) {
    mainName = detail.marketName.slice(0, parenIdx).trim();
    subName = detail.marketName.slice(parenIdx).trim();
  }

  const tradeTypeColor = detail.side === "fall" ? "text-opt-fall" : "text-opt-rise";
  const TradeIcon = detail.side === "fall" ? ArrowDownRight : ArrowUpRight;

  const isTurbos = detail.type === "turbos" || detail.type === "TURBOSLONG" || detail.type === "TURBOSSHORT";
  const isMultiplier = detail.type.toLowerCase().includes("mult");

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-r border-opt-line p-4 [scrollbar-width:thin]">
      
      {/* Header Badge */}
      <div className="flex items-center gap-3 rounded-lg border border-opt-line bg-gradient-to-r from-opt-bg-sunk to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-opt-bg-elev text-[10px] font-bold text-opt-ink shadow-sm">
            {mainName.slice(0, 3)}
          </span>
          <div className="flex flex-col justify-center">
            <span className="text-[12.5px] font-bold leading-tight text-opt-ink">
              {mainName}
            </span>
            {subName && (
              <span className="text-[11px] font-medium leading-tight text-opt-ink-3">
                {subName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-start justify-end gap-1">
          <TradeIcon className={`mt-0.5 h-[18px] w-[18px] ${tradeTypeColor}`} strokeWidth={2.5} />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[12.5px] font-bold leading-tight text-opt-ink">
              {detail.tradeTypeLabel}
            </span>
            {detail.growthRate !== undefined && detail.growthRate > 0 && (
              <span className="rounded-full border border-opt-line bg-opt-bg px-1.5 py-[1px] text-[10px] font-bold text-opt-ink-2 shadow-sm">
                {Math.round(detail.growthRate * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <span className="w-fit rounded bg-opt-bg-sunk px-2 py-0.5 text-[11px] font-semibold text-opt-ink-3">
        USD
      </span>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {isTurbos ? (
          <>
            <Stat label="Stake" value={detail.stake.toFixed(2)} />
            <Stat label="Contract value" value={detail.contractValue.toFixed(2)} className={lost ? "text-opt-ink-3" : "text-opt-rise"} />
            <Stat label="Entry spot" value={detail.entrySpot.toFixed(Math.abs(detail.entrySpot) < 10 ? 4 : 2)} />
            <Stat label="Take profit" value="-" />
            <Stat label="Barrier" value={detail.barrier.toFixed(Math.abs(detail.entrySpot) < 10 ? 4 : 2)} />
            {detail.payoutPerPoint !== undefined ? (
              <Stat label="Payout per point" value={`${detail.payoutPerPoint.toFixed(2)} USD`} />
            ) : (
              <div />
            )}
          </>
        ) : isMultiplier ? (
          <>
            <Stat label="Contract cost" value={detail.stake.toFixed(2)} />
            <Stat label="Contract value" value={detail.contractValue.toFixed(2)} className={lost ? "text-opt-ink-3" : "text-opt-rise"} />
            <Stat label="Deal cancel. fee" value="-" />
            <Stat label="Take profit" value="-" />
            <Stat label="Stake" value={detail.stake.toFixed(2)} />
            <Stat label="Stop loss" value="-" />
          </>
        ) : (
          <>
            <Stat label="Total profit/loss" value={detail.pnl.toFixed(2)} className={pnlClass} />
            <Stat
              label="Contract value"
              value={detail.contractValue.toFixed(2)}
              className={lost ? "text-opt-ink-3" : "text-opt-rise"}
            />
            <Stat label="Stake" value={detail.stake.toFixed(2)} />
            {(detail.type === "vanillas" || detail.type === "VANILLALONGCALL" || detail.type === "VANILLALONGPUT") && detail.payoutPerPoint !== undefined ? (
              <Stat label="Payout per point" value={`${detail.payoutPerPoint.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USD`} />
            ) : (
              <Stat label="Potential payout" value={detail.payout.toFixed(2)} />
            )}
          </>
        )}
      </div>

      {/* For Turbos & Multipliers, Total profit/loss is separated */}
      {(isTurbos || isMultiplier) && (
        <div className={cn("mt-2 flex flex-col justify-center p-3", isTurbos ? "items-center rounded bg-opt-bg-elev border border-opt-line" : "items-start")}>
          <span className="text-[11px] font-semibold text-opt-ink-3">Total profit/loss:</span>
          <span className={`text-[15px] font-bold ${pnlClass}`}>{detail.pnl.toFixed(2)}</span>
        </div>
      )}

      <div className="h-px bg-opt-line" />

      <div className="flex flex-col gap-0 relative pt-1">
        {/* Continuous timeline background line */}
        <div className="absolute left-[7px] top-[140px] bottom-[20px] w-px bg-opt-line z-0" />

        <Row label="Reference ID" icon={<FileText className="w-3.5 h-3.5 text-opt-ink-3" />}>
          <div className="flex flex-col gap-0.5">
            {detail.buyTransactionId > 0 ? (
              <a
                href={`https://dtrader.deriv.com/contract/${detail.derivContractId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {detail.buyTransactionId} (Buy)
              </a>
            ) : (
              <span>—</span>
            )}
            {detail.sellTransactionId > 0 && (
              <span>{detail.sellTransactionId} (Sell)</span>
            )}
          </div>
        </Row>
        
        {isMultiplier ? (
          <Row label="% Commission" icon={<FileText className="w-3.5 h-3.5 text-opt-ink-3" />}>
            <span>{detail.commission !== undefined ? `${detail.commission.toFixed(2)} USD` : "0.00 USD"}</span>
          </Row>
        ) : (
          <Row label="Duration" icon={<Clock className="w-3.5 h-3.5 text-opt-ink-3" />}>
            <span>{detail.duration}</span>
          </Row>
        )}

        {detail.type === "even_odd" || detail.type === "DIGITEVEN" || detail.type === "DIGITODD" ? (
          <Row label="Target" icon={<Target className="w-3.5 h-3.5 text-opt-ink-3" />}>
            <span className="font-sans text-[14px] font-semibold text-opt-ink">
              {detail.side === "fall" ? "Odd" : "Even"}
            </span>
          </Row>
        ) : detail.type === "matches_differs" ? (
          <Row label="Target" icon={<Target className="w-3.5 h-3.5 text-opt-ink-3" />}>
            <span className="font-sans text-[14px] font-semibold text-opt-ink">
              {detail.tradeTypeLabel === "Matches" ? "Equals " : "Differs from "} {detail.barrier}
            </span>
          </Row>
        ) : detail.type === "over_under" ? (
          <Row label="Target" icon={<Target className="w-3.5 h-3.5 text-opt-ink-3" />}>
            <span className="font-sans text-[14px] font-semibold text-opt-ink">
              {detail.tradeTypeLabel === "Over" ? "Over " : "Under "} {detail.barrier}
            </span>
          </Row>
        ) : (detail.type !== "accumulators" && !isMultiplier) && (
          <Row 
            label={(detail.type === "vanillas" || detail.type === "VANILLALONGCALL" || detail.type === "VANILLALONGPUT") ? "Strike" : "Barrier"}
            icon={<Target className="w-3.5 h-3.5 text-opt-ink-3" />}
          >
            <span>{detail.barrier}</span>
          </Row>
        )}

        <Row label="Start time" icon={<Timer className="w-3.5 h-3.5 text-opt-ink-3" />} isTimeline>
          <span className="text-[12px]">
            {formatContractTime(detail.startTime)}
          </span>
        </Row>
        
        <Row label="Entry spot" icon={<CircleDot className="w-3.5 h-3.5 text-opt-ink" fill="currentColor" />} isTimeline>
          <span>{detail.entrySpot.toFixed(dp)}</span>
          <span className="text-[11px] text-opt-ink-3 mt-0.5">
            {formatContractTime(detail.entryTime)}
          </span>
        </Row>
        
        {/* Combine Exit spot & Exit time to match Deriv's layout better, or just list Exit spot and then Exit time */}
        <Row label="Exit spot" icon={<div className="w-[14px] h-[14px] rounded-full bg-opt-bg border-[3px] border-opt-ink" />} isTimeline>
          <span>{detail.exitSpot.toFixed(dp)}</span>
          <span className="text-[11px] text-opt-ink-3 mt-0.5">
            {formatContractTime(detail.exitTime)}
          </span>
        </Row>
        
        <Row label="Exit time" icon={<Flag className="w-3.5 h-3.5 text-opt-ink" fill="currentColor" />} isTimeline isLast>
          <span className="text-[12px]">
            {formatContractTime(detail.exitTime)}
          </span>
        </Row>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-opt-ink-3">{label}:</span>
      <span className={cn("font-mono text-[14px] font-semibold", className ?? "text-opt-ink")}>
        {value}
      </span>
    </div>
  );
}

function Row({
  label,
  icon,
  isTimeline,
  isLast,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  isTimeline?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 relative pb-4">
      {icon && (
        <div className="flex flex-col items-center pt-1 relative z-10 w-4 shrink-0">
          <div className="bg-opt-bg h-4 w-4 rounded-full flex items-center justify-center relative z-20 shrink-0">
             {icon}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-opt-ink-3 leading-tight">{label}</span>
        <div className="flex flex-col items-start font-mono text-[12px] text-opt-ink leading-tight font-medium">
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePanelBuy } from "@/hooks/usePanelBuy";
import { useAccumulatorPreview } from "@/stores/useAccumulatorPreview";
import { buildProposalRequest } from "../buildProposalRequest";
import { TradeConfirmed } from "../TradeConfirmed";
import { HowToTradeLink } from "../HowToTradeLink";
import { BuyButton } from "../fields/BuyButton";
import { GrowthRatePills } from "../fields/GrowthRatePills";
import { StakeField } from "../fields/StakeField";
import { SummaryRow } from "../fields/SummaryRow";
import { TakeProfitField } from "../fields/TakeProfitField";

interface AccumulatorsPanelProps {
  symbol: string;
}

export function AccumulatorsPanel({ symbol }: AccumulatorsPanelProps) {
  const [growthRate, setGrowthRate] = useState<number>(1); // §6.2 default 1%
  const [stake, setStake] = useState<number>(10);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);

  const request =
    stake > 0
      ? buildProposalRequest({
          contractType: "accumulators",
          symbol,
          stake,
          growthRate,
          takeProfit,
        })
      : null;

  const { buyPhase, lastTrade, canBuy, errorMsg, proposal, handleBuy, handleNewTrade } =
    usePanelBuy(request);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useAccumulatorPreview.getState().setGrowthRate(null);
      useAccumulatorPreview.getState().setBarrierPct(null);
      useAccumulatorPreview.getState().setStats(null);
    };
  }, []);

  // Sync state to preview store
  useEffect(() => {
    useAccumulatorPreview.getState().setGrowthRate(growthRate);

    if (proposal?.high_barrier && proposal?.low_barrier) {
      const h = parseFloat(proposal.high_barrier);
      const l = parseFloat(proposal.low_barrier);
      if (!isNaN(h) && !isNaN(l)) {
        const spot = (h + l) / 2;
        const barrierPct = ((h - l) / 2) / spot;
        useAccumulatorPreview.getState().setBarrierPct(barrierPct);
      }
    }

    if (proposal?.ticks_stayed_in !== undefined) {
      useAccumulatorPreview.getState().setStats(proposal.ticks_stayed_in);
    }
  }, [growthRate, proposal]);

  if (buyPhase === "confirmed" && lastTrade) {
    return <TradeConfirmed trade={lastTrade} side="neutral" onNewTrade={handleNewTrade} />;
  }

  let barrierText = `± ${approximateBarrier(growthRate).toFixed(5)}%`;
  if (proposal?.tick_size_barrier_percentage) {
    const val = proposal.tick_size_barrier_percentage;
    barrierText = val.includes('%') ? `± ${val}` : `± ${val}%`;
  } else if (proposal?.high_barrier && proposal?.low_barrier) {
    const h = parseFloat(proposal.high_barrier);
    const l = parseFloat(proposal.low_barrier);
    if (!isNaN(h) && !isNaN(l)) {
      const spot = (h + l) / 2;
      const barrier = (((h - l) / 2) / spot) * 100;
      barrierText = `± ${barrier.toFixed(5)}%`;
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <HowToTradeLink contractLabel="Accumulators" />
      <GrowthRatePills value={growthRate} onChange={setGrowthRate} />
      <StakeField value={stake} onChange={setStake} min={1} max={2000} />
      <TakeProfitField
        value={takeProfit}
        onToggle={(on) => setTakeProfit(on ? 20 : null)}
        onChange={setTakeProfit}
      />
      <div className="flex flex-col gap-1.5 py-1">
        <SummaryRow label="Max. payout" value="6,000.00 USD" />
        <SummaryRow label="Barrier" value={barrierText} />
        <SummaryRow label="Max. duration" value={`${proposal?.maximum_ticks ?? getMaxDuration(growthRate)} ticks`} />
      </div>
      {errorMsg && (
        <p className="px-1 text-[11px] leading-snug text-opt-fall">{errorMsg}</p>
      )}
      <div className="mt-auto">
        <BuyButton
          side="neutral"
          disabled={!canBuy}
          /* §7: Accumulators show no fixed payout sub-text. */
          payoutLabel={null}
          label={buyPhase !== "idle" ? "Placing…" : "Buy"}
          loading={buyPhase === "buying"}
          onClick={handleBuy}
        />
      </div>
    </div>
  );
}

function approximateBarrier(growthPct: number): number {
  return growthPct * 0.012666;
}

function getMaxDuration(growthPct: number): number {
  switch (growthPct) {
    case 1: return 250;
    case 2: return 125;
    case 3: return 85;
    case 4: return 65;
    case 5: return 50;
    default: return 250;
  }
}

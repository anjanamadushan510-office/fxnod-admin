"use client";

import { useEffect, useState } from "react";
import { usePanelBuy } from "@/hooks/usePanelBuy";
import { buildProposalRequest } from "../buildProposalRequest";
import { TradeConfirmed } from "../TradeConfirmed";
import { HowToTradeLink } from "../HowToTradeLink";
import { useBarrierPreview } from "@/stores/useBarrierPreview";
import { BuyButton } from "../fields/BuyButton";
import { DurationField, useDefaultDuration } from "../fields/DurationField";
import { OffsetField } from "../fields/OffsetField";
import { RiseFallToggle, type Side } from "../fields/RiseFallToggle";
import { StakeField } from "../fields/StakeField";

interface HigherLowerPanelProps {
  symbol: string;
}

export function HigherLowerPanel({ symbol }: HigherLowerPanelProps) {
  const [side, setSide] = useState<Side>("rise");
  const [duration, setDuration] = useDefaultDuration();
  const [barrier, setBarrier] = useState<number>(0.41);
  const [stake, setStake] = useState<number>(10);

  // Flip barrier sign when side changes and sync preview to chart
  useEffect(() => {
    const nextBarrier = side === "fall" ? -Math.abs(barrier) : Math.abs(barrier);
    if (barrier !== nextBarrier) setBarrier(nextBarrier);
    
    useBarrierPreview.getState().setBarrier(nextBarrier);
    return () => useBarrierPreview.getState().setBarrier(null);
  }, [side, barrier]);

  const request =
    stake > 0
      ? buildProposalRequest({
          contractType: "higher_lower",
          symbol,
          stake,
          side,
          duration: { amount: duration.amount, unit: duration.unit },
          barrier,
        })
      : null;

  const { buyPhase, lastTrade, canBuy, payoutLabel, errorMsg, handleBuy, handleNewTrade } =
    usePanelBuy(request);

  if (buyPhase === "confirmed" && lastTrade) {
    return <TradeConfirmed trade={lastTrade} side={side} onNewTrade={handleNewTrade} />;
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <HowToTradeLink contractLabel="Higher/Lower" />
      <RiseFallToggle
        value={side}
        onChange={setSide}
        labels={{ rise: "Higher", fall: "Lower" }}
      />
      <DurationField value={duration} onChange={setDuration} />
      <OffsetField label="Barrier" value={barrier} onChange={setBarrier} />
      <StakeField value={stake} onChange={setStake} min={1} max={2000} />
      {errorMsg && (
        <p className="px-1 text-[11px] leading-snug text-opt-fall">{errorMsg}</p>
      )}
      <div className="mt-auto">
        <BuyButton
          side={side}
          disabled={!canBuy}
          payoutLabel={payoutLabel}
          label={buyPhase !== "idle" ? "Placing…" : "Buy"}
          loading={buyPhase === "buying"}
          onClick={handleBuy}
        />
      </div>
    </div>
  );
}

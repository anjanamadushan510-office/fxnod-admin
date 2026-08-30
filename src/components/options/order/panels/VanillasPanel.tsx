"use client";

import { useState, useEffect } from "react";
import { usePanelBuy } from "@/hooks/usePanelBuy";
import { buildProposalRequest } from "../buildProposalRequest";
import { TradeConfirmed } from "../TradeConfirmed";
import { HowToTradeLink } from "../HowToTradeLink";
import { BuyButton } from "../fields/BuyButton";
import { useBarrierPreview } from "@/stores/useBarrierPreview";
import { DurationField, useDefaultDuration } from "../fields/DurationField";
import { OffsetField } from "../fields/OffsetField";
import { RiseFallToggle, type Side } from "../fields/RiseFallToggle";
import { StakeField } from "../fields/StakeField";
import { SummaryRow } from "../fields/SummaryRow";

interface VanillasPanelProps {
  symbol: string;
}

export function VanillasPanel({ symbol }: VanillasPanelProps) {
  const [side, setSide] = useState<Side>("rise");
  const [duration, setDuration] = useDefaultDuration({ amount: 1, unit: 'min' });
  const [strike, setStrike] = useState<number>(0);
  const [stake, setStake] = useState<number>(10);

  // Sync strike price to chart preview line
  useEffect(() => {
    useBarrierPreview.getState().setBarrier(strike);
    return () => useBarrierPreview.getState().setBarrier(null);
  }, [strike]);

  const request =
    stake > 0
      ? buildProposalRequest({
          contractType: "vanillas",
          symbol,
          stake,
          side,
          duration: { amount: duration.amount, unit: duration.unit },
          barrier: strike,
        })
      : null;

  const { buyPhase, lastTrade, canBuy, errorMsg, handleBuy, handleNewTrade, proposal } = usePanelBuy(request);

  useEffect(() => {
    if (errorMsg && errorMsg.includes("Barriers available are")) {
      const match = errorMsg.match(/Barriers available are (.*)/);
      if (match) {
        const barriers = match[1].split(',').map(s => Number(s.trim().replace(/\.$/, '')));
        if (barriers.length > 0 && !barriers.includes(strike)) {
          // Default to the first available positive barrier, or just the first one
          const defaultBarrier = barriers.find(b => b > 0) ?? barriers[0];
          setStrike(defaultBarrier);
        }
      }
    }
  }, [errorMsg, strike]);

  if (buyPhase === "confirmed" && lastTrade) {
    return <TradeConfirmed trade={lastTrade} side={side} onNewTrade={handleNewTrade} />;
  }

  // Payout per point for Vanillas is the 'display_number_of_contracts' field from the API.
  const payoutPerPoint = proposal?.display_number_of_contracts ?? proposal?.payout_amount ?? '...';

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <HowToTradeLink contractLabel="Vanillas" />
      <RiseFallToggle
        value={side}
        onChange={setSide}
        labels={{ rise: "Call", fall: "Put" }}
      />
      <DurationField value={duration} onChange={setDuration} allowTicks={false} allowSeconds={false} />
      <OffsetField
        label="Strike price"
        value={strike}
        onChange={setStrike}
        withInfo
        infoLabel="Strike price info"
      />
      <StakeField value={stake} onChange={setStake} min={1} max={2000} />
      <div className="py-1">
        <SummaryRow label="Payout per point" value={`${payoutPerPoint} USD`} />
      </div>
      {errorMsg && (
        <p className="px-1 text-[11px] leading-snug text-opt-fall">{errorMsg}</p>
      )}
      <div className="mt-auto">
        <BuyButton
          side={side}
          disabled={!canBuy}
          /* §7: Vanillas Call=green / Put=red, no fixed payout sub-text. */
          payoutLabel={null}
          label={buyPhase !== "idle" ? "Placing…" : "Buy"}
          loading={buyPhase === "buying"}
          onClick={handleBuy}
        />
      </div>
    </div>
  );
}

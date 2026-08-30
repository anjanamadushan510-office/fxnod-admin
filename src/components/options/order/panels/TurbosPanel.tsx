"use client";

import { useState, useEffect } from "react";
import { usePanelBuy } from "@/hooks/usePanelBuy";
import { buildProposalRequest } from "../buildProposalRequest";
import { TradeConfirmed } from "../TradeConfirmed";
import { HowToTradeLink } from "../HowToTradeLink";
import { BuyButton } from "../fields/BuyButton";
import { DurationField, useDefaultDuration } from "../fields/DurationField";
import { PayoutPerPointField } from "../fields/PayoutPerPointField";
import { type Side } from "../fields/RiseFallToggle";
import { StakeField } from "../fields/StakeField";
import { SummaryRow } from "../fields/SummaryRow";
import { TakeProfitField } from "../fields/TakeProfitField";
import { UpDownToggle } from "../fields/UpDownToggle";

interface TurbosPanelProps {
  symbol: string;
}

export function TurbosPanel({ symbol }: TurbosPanelProps) {
  const [side, setSide] = useState<Side>("rise");
  // §13: Turbos default 5 ticks.
  const [duration, setDuration] = useDefaultDuration({ amount: 5, unit: "ticks" });
  const [stake, setStake] = useState<number>(10);
  const [payoutPerPoint, setPayoutPerPoint] = useState<number>(1.5);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);

  const request =
    stake > 0
      ? buildProposalRequest({
          contractType: "turbos",
          symbol,
          stake,
          side,
          duration: { amount: duration.amount, unit: duration.unit },
          takeProfit,
          payoutPerPoint,
        })
      : null;

  const {
    buyPhase, lastTrade, canBuy, errorMsg, handleBuy, handleNewTrade, proposal,
    payoutChoices,
  } =
    usePanelBuy(request);

  // MUST stay above the early return below. This effect used to sit after it,
  // so a confirmed trade rendered one fewer hook than the previous render —
  // React throws "Rendered fewer hooks than expected" on that transition. The
  // first lint run caught it; react-hooks/rules-of-hooks is an error, not a
  // style warning, for exactly this reason.
  useEffect(() => {
    // Choices can arrive without a proposal (e.g. after a proposal error), so
    // fall back to the separately-tracked list.
    const available = proposal?.payout_choices ?? payoutChoices;
    if (available && available.length > 0) {
      const choices = available;
      const currentStr = payoutPerPoint.toString();
      // If current value is invalid, snap to the middle choice
      if (!choices.includes(currentStr)) {
        const middleIndex = Math.floor(choices.length / 2);
        setPayoutPerPoint(parseFloat(choices[middleIndex]));
      }
    }
  }, [proposal?.payout_choices, payoutChoices, payoutPerPoint]);

  if (buyPhase === "confirmed" && lastTrade) {
    return <TradeConfirmed trade={lastTrade} side={side} onNewTrade={handleNewTrade} />;
  }

  // Fallback to placeholder if proposal is not yet loaded
  const displayBarrier = proposal?.barrier ?? (side === "rise" ? "-6.46" : "+6.46");

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <HowToTradeLink contractLabel="Turbos" />
      <UpDownToggle value={side} onChange={setSide} />
      <DurationField value={duration} onChange={setDuration} />
      <StakeField value={stake} onChange={setStake} min={1} max={2000} />
      <PayoutPerPointField value={payoutPerPoint} onChange={setPayoutPerPoint} choices={proposal?.payout_choices ?? payoutChoices} />
      <TakeProfitField
        value={takeProfit}
        onToggle={(on) => setTakeProfit(on ? 20 : null)}
        onChange={setTakeProfit}
      />
      <div className="py-1">
        <SummaryRow label="Barrier" value={displayBarrier} />
      </div>
      {errorMsg && (
        <p className="px-1 text-[11px] leading-snug text-opt-fall">{errorMsg}</p>
      )}
      <div className="mt-auto">
        <BuyButton
          side={side}
          disabled={!canBuy}
          /* §7: Turbos show payout-per-point, not a fixed total payout. */
          payoutLabel={null}
          label={buyPhase !== "idle" ? "Placing…" : "Buy"}
          loading={buyPhase === "buying"}
          onClick={handleBuy}
        />
      </div>
    </div>
  );
}

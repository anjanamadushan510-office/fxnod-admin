"use client";

import { useEffect, useState } from "react";

export type PositionContractType = string;
export interface Position {
  id: string;
  /** Deriv contract id — the correlation key for the positions WS stream.
   *  Undefined for legacy/mock rows that predate real execution. */
  contractId?: string;
  marketId: string;
  marketName: string;
  contractType: PositionContractType;
  side: "rise" | "fall" | "up" | "down" | "accum";
  growthRate?: number;
  /** Display sub-label: "Tick 3", "1/85 ticks", etc. */
  status?: string;
  stake: number;
  contractValue: number;
  /** Where the contract was opened. */
  entrySpot?: number;
  currentSpot?: number;
  exitSpot?: number;
  /** For Accumulators / Turbos / Multipliers. */
  barrier?: number | string;
  takeProfit?: number | null;
  /** Live P/L (ticks every second in this mock). */
  pnl: number;
  /** "won" / "lost" / null when ongoing. */
  outcome?: "won" | "lost" | null;
  /** Target completion epoch seconds for time-based trades. */
  expiryTime?: number;
  startTime?: number;
  /** True if the contract duration is in ticks. */
  isTick?: boolean;
  /** Live tick stream from the backend. */
  tickStream?: any[];
  buy_transaction_id?: number;
  sell_transaction_id?: number;
  display_number_of_contracts?: string;
  commission?: number;
}

/**
 * Drop-in placeholder for the future `usePositions()` real-time hook.
 *
 * Returns a small fixed set of positions; P/L drifts every second so the
 * Positions drawer feels alive when opened. Replace with Trading service
 * WebSocket subscription later — the shape of `Position` stays identical
 * so consumer components don't change.
 */
export function useMockPositions(): Position[] {
  const [positions, setPositions] = useState<Position[]>(() => seed());

  useEffect(() => {
    const id = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => ({
          ...p,
          pnl: +(p.pnl + (Math.random() - 0.5) * 0.1).toFixed(2),
        })),
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return positions;
}

function seed(): Position[] {
  return [
    {
      id: "pos_1",
      marketId: "vol_100_1s",
      marketName: "Volatility 100 (1s) Index",
      contractType: "turbos",
      side: "up",
      status: "Tick 3",
      stake: 10,
      contractValue: 10.22,
      entrySpot: 1016.41,
      barrier: 1009.95,
      takeProfit: null,
      pnl: +0.22,
    },
  ];
}



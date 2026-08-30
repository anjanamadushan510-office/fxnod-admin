"use client";

import { useEffect, useRef, useState } from "react";
import { useDerivWebSocket } from "./useDerivWebSocket";
import { toDerivSymbol } from "@/services/deriv/derivSymbols";
import type { DerivMessage } from "@/hooks/useDerivWebSocket";

const SEED = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

interface DerivHistoryMsg extends DerivMessage {
  history?: {
    prices: number[];
    times: number[];
  };
  tick?: {
    epoch: number;
    quote: number;
    pip_size?: number;
  };
}

/**
 * Live last-digit frequency distribution (0–9) for Matches/Differs &
 * Over/Under. Uses Deriv WebSocket to fetch ticks_history and subscribe to live ticks.
 */
export function useDigitStats(symbol?: string, enabled = true, count = 1000): number[] {
  const [pcts, setPcts] = useState<number[]>(SEED);
  const derivSymbol = symbol ? toDerivSymbol(symbol) : undefined;
  const active = enabled && Boolean(derivSymbol);
  
  const { subscribe } = useDerivWebSocket(active);
  const ticksRef = useRef<number[]>([]);
  const pipSizeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !derivSymbol) {
      setPcts(SEED);
      return;
    }
    
    ticksRef.current = [];
    pipSizeRef.current = null;
    
    const payload = {
      ticks_history: derivSymbol,
      end: "latest",
      count,
      style: "ticks",
      subscribe: 1,
    };
    
    const unsubscribe = subscribe(payload, (raw) => {
      const msg = raw as DerivHistoryMsg;
      if (msg.error) return;
      
      if (msg.msg_type === "history" && msg.history?.prices) {
        ticksRef.current = msg.history.prices.map(Number);
        updatePcts();
      } else if (msg.msg_type === "tick" && msg.tick?.quote !== undefined) {
        if (msg.tick.pip_size !== undefined && pipSizeRef.current === null) {
          pipSizeRef.current = msg.tick.pip_size;
          updatePcts(); // re-evaluate history now that we have pip_size
        }
        ticksRef.current.push(Number(msg.tick.quote));
        if (ticksRef.current.length > count) {
          ticksRef.current.shift();
        }
        updatePcts();
      }
    });
    
    return unsubscribe;
  }, [active, derivSymbol, count, subscribe]);

  function updatePcts() {
    const ticks = ticksRef.current;
    if (!ticks.length) return;
    
    const pipSize = pipSizeRef.current;
    if (pipSize === null) return; // Wait for first tick to know decimal places

    const counts = new Array(10).fill(0);
    for (const t of ticks) {
      const str = t.toFixed(pipSize);
      const lastChar = str[str.length - 1];
      const digit = parseInt(lastChar, 10);
      if (!isNaN(digit)) counts[digit]++;
    }
    
    const total = ticks.length;
    setPcts(counts.map(c => Number(((c / total) * 100).toFixed(1))));
  }

  return pcts;
}

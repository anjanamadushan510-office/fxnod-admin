"use client";

import { useCallback, useRef, useState } from "react";
import { useDerivChartFeed, type FeedCandle } from "@/hooks/useDerivChartFeed";
import { toDerivSymbol } from "@/services/deriv/derivSymbols";
import type { Candle } from "./BotChart";

/**
 * Live candles for the dBot chart.
 *
 * Reuses the dTrader chart feed rather than adding a second market-data path:
 * the socket is shared, so opening the bot screen alongside dTrader costs no
 * extra connection to Deriv.
 *
 * This is DISPLAY data only. The bot's own decisions are made server-side from
 * the worker's market-data hub — deliberately, because a bot runs while this tab
 * is closed, and a strategy reading prices the browser supplied would be a
 * strategy the user could steer.
 */
export interface BotCandlesResult {
  candles: Candle[];
  /** False until enough history has arrived to draw anything. */
  ready: boolean;
}

/** Candle width for the bot chart, in seconds. */
const GRANULARITY = 60;

/** Bars retained. Bollinger(20) needs 20; the rest is context for the eye. */
const MAX_CANDLES = 200;

export function useBotCandles(
  marketId: string,
  enabled = true,
): BotCandlesResult {
  const [candles, setCandles] = useState<Candle[]>([]);
  // The live array lives in a ref as well so the upsert path does not depend on
  // the previous render's state closure.
  const ref = useRef<Candle[]>([]);

  const derivSymbol = toDerivSymbol(marketId);

  const commit = useCallback((next: Candle[]) => {
    ref.current = next;
    setCandles(next);
  }, []);

  const onSeedCandles = useCallback(
    (seed: FeedCandle[]) => {
      const mapped = seed.map(toChartCandle);
      commit(mapped.slice(-MAX_CANDLES));
    },
    [commit],
  );

  const onCandle = useCallback(
    (incoming: FeedCandle) => {
      const bar = toChartCandle(incoming);
      const current = ref.current;
      const last = current[current.length - 1];

      // Deriv re-sends the forming bar as it updates, so the same open time
      // arrives many times. Upsert on it — appending would multiply one minute
      // into dozens of bars and wreck every indicator drawn from them.
      if (last && last.time === bar.time) {
        const next = current.slice(0, -1);
        next.push(bar);
        commit(next);
        return;
      }

      // Out of order or replayed: ignore rather than corrupt the ordering the
      // indicator maths depends on.
      if (last && bar.time < last.time) return;

      const next = [...current, bar];
      commit(next.length > MAX_CANDLES ? next.slice(-MAX_CANDLES) : next);
    },
    [commit],
  );

  useDerivChartFeed({
    derivSymbol,
    style: "candles",
    granularity: GRANULARITY,
    enabled: enabled && Boolean(derivSymbol),
    onSeedCandles,
    onCandle,
  });

  return {
    candles,
    // The chart needs 24 bars before Bollinger produces anything, so anything
    // less would render candles with three empty overlays.
    ready: candles.length >= 24,
  };
}

/**
 * The feed reports open time in epoch SECONDS; the chart works in
 * milliseconds. Getting this wrong puts every bar in 1970.
 */
function toChartCandle(c: FeedCandle): Candle {
  return {
    time: c.time * 1000,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  };
}

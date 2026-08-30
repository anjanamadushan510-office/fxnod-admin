import type { BotIndicatorKind } from "@/services/api/model";

/**
 * Per-bot presentation metadata.
 *
 * Everything FUNCTIONAL comes from the backend — `GET /bots/strategies`
 * returns each bot's id, name, description, supported contract types and a
 * JSON Schema for its parameters. This file holds only what a schema cannot
 * express: which contract fields to render, and what to call the two sides.
 *
 * Keyed by the backend's strategy_id. A bot the backend adds but this file does
 * not know still appears in the picker and still starts — it just falls back to
 * generic labels, which is the right failure mode for a catalogue that is meant
 * to keep growing.
 */

/** Which contract-template controls a bot needs. */
export interface BotFormShape {
  /** "Up / Down", "Rise / Fall", "Matches / Differs", … */
  sideLabels?: [string, string];
  /** Leverage picker (multipliers). */
  multiplier?: boolean;
  /** Growth-rate picker 1–5% (accumulators). */
  growthRate?: boolean;
  /** Duration + unit inputs. */
  duration?: boolean;
  /** Digit 0–9 picker. */
  digit?: boolean;
  /** Barrier-digit picker 0–8 (over/under). */
  barrierDigit?: boolean;
  /** Relative/absolute barrier with an offset (touch/no touch, higher/lower). */
  barrierOffset?: boolean;
  /** Per-contract take profit is meaningful for this type. */
  takeProfit?: boolean;
  /** Per-contract stop loss is meaningful for this type. */
  perTradeStopLoss?: boolean;
}

export const BOT_FORMS: Record<string, BotFormShape> = {
  accumulator: { growthRate: true, takeProfit: true },
  multiplier: {
    sideLabels: ["Up", "Down"],
    multiplier: true,
    takeProfit: true,
    perTradeStopLoss: true,
  },
  rise_fall: { sideLabels: ["Rise", "Fall"], duration: true },
  higher_lower: { sideLabels: ["Higher", "Lower"], duration: true, barrierOffset: true },
  touch_no_touch: { sideLabels: ["Touch", "No Touch"], duration: true, barrierOffset: true },
  matches_differs: { sideLabels: ["Matches", "Differs"], duration: true, digit: true },
  even_odd: { sideLabels: ["Even", "Odd"], duration: true },
  over_under: { sideLabels: ["Over", "Under"], duration: true, barrierDigit: true },
};

export function formShapeFor(strategyId: string): BotFormShape {
  return BOT_FORMS[strategyId] ?? { sideLabels: ["Up", "Down"], duration: true };
}

/**
 * Leverage steps for multiplier contracts.
 *
 * These are Deriv's actual multiplier tiers. An earlier version of this file
 * guessed ×2–×20, which is off by two orders of magnitude — a user picking
 * "×2" would have been placing a trade the broker never offered.
 */
export const MULTIPLIER_STEPS = [100, 200, 300, 400, 500, 600, 1000] as const;

/** Accumulator growth rates, as Deriv offers them. */
export const GROWTH_RATES = [1, 2, 3, 4, 5] as const;

export const DURATION_UNITS = [
  { value: "t", label: "Ticks (t)" },
  { value: "s", label: "Seconds (s)" },
  { value: "m", label: "Minutes (m)" },
  { value: "h", label: "Hours (h)" },
  { value: "d", label: "Days (d)" },
] as const;

/**
 * Indicators the user can add.
 *
 * `directional` mirrors the engine: ATR measures how much price moves, not
 * which way, so it cannot unlock "auto" direction. The backend re-checks this —
 * the flag here only keeps the UI from offering Auto before it would work.
 */
export interface IndicatorMeta {
  kind: BotIndicatorKind;
  label: string;
  /** Rendered under the name to explain what adding it does. */
  hint: string;
  directional: boolean;
  /** Default period shown in the picker; the backend applies the same value. */
  defaultPeriod?: number;
}

export const INDICATORS: IndicatorMeta[] = [
  { kind: "rsi", label: "RSI", hint: "Oversold argues up, overbought argues down", directional: true, defaultPeriod: 14 },
  { kind: "bb", label: "Bollinger Bands", hint: "Below the lower band argues up, above the upper argues down", directional: true, defaultPeriod: 20 },
  { kind: "stoch", label: "Stochastic", hint: "Same read as RSI, over the recent high/low range", directional: true, defaultPeriod: 14 },
  { kind: "macd", label: "MACD", hint: "Histogram above zero argues up, below argues down", directional: true },
  { kind: "ema", label: "EMA", hint: "Price above the average argues up", directional: true, defaultPeriod: 20 },
  { kind: "sma", label: "SMA", hint: "Price above the average argues up", directional: true, defaultPeriod: 20 },
  { kind: "atr", label: "ATR", hint: "Volatility filter only — does not pick a direction", directional: false, defaultPeriod: 14 },
];

export function indicatorMeta(kind: BotIndicatorKind): IndicatorMeta {
  return INDICATORS.find((i) => i.kind === kind) ?? {
    kind,
    label: kind.toUpperCase(),
    hint: "",
    directional: kind !== "atr",
  };
}

/** Markets bots run on — the continuously-quoted synthetics. */
export const BOT_MARKET_IDS = [
  "vol_75_1s",
  "vol_100_1s",
  "vol_50_1s",
  "vol_25_1s",
] as const;

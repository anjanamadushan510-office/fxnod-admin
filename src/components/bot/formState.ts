import type {
  BotIndicator,
  StartBotRunRequest,
} from "@/services/api/model";
import { findMarket } from "@/components/options/market/catalog";
import { toDerivSymbol } from "@/services/deriv/derivSymbols";
import { formShapeFor } from "./botMeta";

export type Direction = "up" | "down" | "auto";

/**
 * The configuration form's state.
 *
 * Amounts are held as STRINGS all the way through — from the input to the JSON
 * body. The API takes decimals as strings to preserve precision, so parsing
 * them into numbers here just to serialise them again would round-trip every
 * stake through a float for no reason.
 */
export interface BotFormState {
  marketId: string;
  currency: string;
  direction: Direction;

  growthRate: number;
  multiplier: number;
  digit: number;
  autoDigit: boolean;
  barrierDigit: number;
  barrierAbove: boolean;
  barrierOffset: string;
  duration: string;
  durationUnit: string;

  stake: string;
  takeProfit: string;
  perTradeStopLoss: string;

  sessionStopLoss: string;
  sessionTargetProfit: string;
  maxTrades: string;

  martingaleEnabled: boolean;
  martingaleMultiplier: string;
  martingaleMaxSteps: string;

  indicators: BotIndicator[];
}

export function defaultFormState(): BotFormState {
  return {
    marketId: "vol_75_1s",
    currency: "USD",
    direction: "up",

    growthRate: 1,
    multiplier: 100,
    digit: 5,
    autoDigit: false,
    barrierDigit: 5,
    barrierAbove: true,
    barrierOffset: "1",
    duration: "5",
    durationUnit: "t",

    stake: "10",
    takeProfit: "",
    perTradeStopLoss: "",

    // Pre-filled rather than blank: it is required, and an empty required field
    // is a worse default than a conservative one the user can raise.
    sessionStopLoss: "50",
    sessionTargetProfit: "",
    maxTrades: "",

    martingaleEnabled: false,
    martingaleMultiplier: "2",
    martingaleMaxSteps: "3",

    indicators: [],
  };
}

/** A blank or whitespace-only field means "not set", not zero. */
function optional(raw: string): string | undefined {
  const v = raw.trim();
  return v === "" ? undefined : v;
}

function optionalInt(raw: string): number | undefined {
  const v = optional(raw);
  if (v === undefined) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export interface BuildResult {
  request?: StartBotRunRequest;
  /** Client-side problems, so the user is not sent to the server to be told. */
  errors: string[];
}

/**
 * Turns form state into a start request.
 *
 * Only shapes the payload — every rule here is ALSO enforced server-side, which
 * is the copy that counts. These checks exist so an obvious mistake is caught
 * without a round trip, never as the enforcement itself.
 */
export function buildStartRequest(
  strategyId: string,
  contractType: string,
  state: BotFormState,
): BuildResult {
  const shape = formShapeFor(strategyId);
  const errors: string[] = [];

  const market = findMarket(state.marketId);
  if (!market) {
    errors.push("Pick a market.");
  }
  const symbol = market ? toDerivSymbol(market.id) : undefined;
  if (market && !symbol) {
    errors.push(`${market.name} is not available for bots.`);
  }

  if (!isPositiveDecimal(state.stake)) {
    errors.push("Stake must be a positive amount.");
  }
  if (!isPositiveDecimal(state.sessionStopLoss)) {
    errors.push("Session stop loss is required and must be positive.");
  }

  if (state.martingaleEnabled) {
    const mult = Number.parseFloat(state.martingaleMultiplier);
    if (!Number.isFinite(mult) || mult <= 1) {
      errors.push("Martingale multiplier must be greater than 1.");
    }
    const steps = optionalInt(state.martingaleMaxSteps);
    if (steps === undefined || steps <= 0) {
      errors.push("Martingale max steps must be a positive number.");
    }
  }

  if (errors.length > 0 || !symbol) {
    return { errors };
  }

  const request: StartBotRunRequest = {
    strategy_id: strategyId,
    contract_template: {
      contract_type: contractType,
      symbol,
      currency: state.currency,
      ...(shape.duration
        ? { duration: optionalInt(state.duration), duration_unit: state.durationUnit as never }
        : {}),
      ...(shape.growthRate ? { growth_rate: state.growthRate } : {}),
      ...(shape.multiplier ? { multiplier: state.multiplier } : {}),
      // A relative barrier is signed: "+1" is above spot, "-1" below. Deriv
      // reads the sign, so it is part of the value rather than a flag.
      ...(shape.barrierOffset
        ? { barrier: `${state.barrierAbove ? "+" : "-"}${state.barrierOffset.trim()}` }
        : {}),
      ...(shape.barrierDigit ? { digit: state.barrierDigit } : {}),
      // Skipped when auto_digit is on: the strategy chooses it per trade from
      // the recent distribution, and sending one here would be ignored anyway.
      ...(shape.digit && !state.autoDigit ? { digit: state.digit } : {}),
    },
    strategy_parameters: buildStrategyParameters(strategyId, state),
    indicators: state.indicators,
    risk_limits: {
      stake_per_trade: state.stake.trim(),
      session_stop_loss: state.sessionStopLoss.trim(),
      session_target_profit: optional(state.sessionTargetProfit),
      take_profit: shape.takeProfit ? optional(state.takeProfit) : undefined,
      stop_loss: shape.perTradeStopLoss ? optional(state.perTradeStopLoss) : undefined,
      martingale_enabled: state.martingaleEnabled,
      martingale_multiplier: state.martingaleEnabled
        ? state.martingaleMultiplier.trim()
        : undefined,
      martingale_max_steps: state.martingaleEnabled
        ? optionalInt(state.martingaleMaxSteps)
        : undefined,
      max_trades: optionalInt(state.maxTrades),
    },
  };

  return { request, errors: [] };
}

/**
 * The bot-specific parameter object.
 *
 * Each bot validates this against its own JSON Schema and REJECTS unknown
 * fields, so only what the selected bot actually accepts may be included — a
 * stray key fails the request rather than being ignored.
 */
function buildStrategyParameters(
  strategyId: string,
  state: BotFormState,
): Record<string, unknown> {
  switch (strategyId) {
    case "accumulator":
      return {};

    case "multiplier":
    case "rise_fall":
    case "higher_lower":
    case "touch_no_touch":
      return { direction: state.direction };

    case "matches_differs":
      return {
        prediction: state.direction === "down" ? "differs" : "matches",
        ...(state.autoDigit ? { auto_digit: true } : { digit: state.digit }),
      };

    case "even_odd":
      return { prediction: state.direction === "down" ? "odd" : "even" };

    case "over_under":
      return {
        prediction: state.direction === "down" ? "under" : "over",
        barrier: state.barrierDigit,
      };

    default:
      return {};
  }
}

function isPositiveDecimal(raw: string): boolean {
  const v = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(v)) return false;
  return Number.parseFloat(v) > 0;
}

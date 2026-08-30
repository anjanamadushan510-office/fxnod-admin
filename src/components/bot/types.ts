/**
 * Shared types for the dBot UI.
 *
 * These mirror the backend's `auto_*` contract (bot_runs, strategies, run
 * trades) closely enough that wiring the real API later is a data-source swap,
 * not a rewrite of the components. Nothing here is generated yet — once the
 * `auto_*` endpoints land in openapi.yaml, prefer the Orval-generated types
 * over these and delete whatever they duplicate.
 */

/** A bot the user can pick. Mirrors the backend strategy Descriptor. */
export interface BotDefinition {
  id: string;
  name: string;
  tagline: string;
  /** Frontend contract type this bot trades ("accumulators", "multipliers"). */
  contractType: string;
  /** Not yet implemented — rendered locked in the picker. */
  comingSoon?: boolean;
}

export type BotStatus = "idle" | "running" | "paused" | "stopping";

export type TradeDirection = "up" | "down";

export type TradeResult = "won" | "lost" | "open";

/** One row of the session's trade history. */
export interface BotTrade {
  id: string;
  /** HH:MM:SS in the user's locale. */
  time: string;
  direction: TradeDirection;
  stake: number;
  result: TradeResult;
  /** Null while the contract is still open. */
  pnl: number | null;
}

/** Live totals for the current run. Maps onto the bot_runs aggregate columns. */
export interface BotSession {
  status: BotStatus;
  realizedPnl: number;
  /** Realized P&L as a percentage of the session's committed capital. */
  realizedPnlPct: number;
  tradesTotal: number;
  tradesWon: number;
  tradesLost: number;
  /** Progress toward the configured target profit, in account currency. */
  targetProfitProgress: number;
  targetProfitLimit: number;
  /** Loss accumulated so far against the configured stop loss. */
  stopLossProgress: number;
  stopLossLimit: number;
  currency: string;
}

export function winRate(session: BotSession): number {
  const settled = session.tradesWon + session.tradesLost;
  return settled === 0 ? 0 : (session.tradesWon / settled) * 100;
}

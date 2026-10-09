/**
 * Exact arithmetic on the decimal strings the API sends for money.
 *
 * The console shows an operator what a payout will do before they commit to
 * it, and that figure has to be the one the server will reach. Parsing
 * "30.117" into a number to multiply it makes it a float, and a float is how
 * a preview comes to differ from the ledger by a cent. Amounts are held here
 * as whole hundred-millionths in a BigInt: the ledger's own eight places.
 */

const PLACES = 8;
const ONE = BigInt(10) ** BigInt(PLACES);
const ZERO = BigInt(0);
const DECIMAL = /^\d+(\.\d+)?$/;

/** "30.117" to 3011700000n. Null for anything that is not a plain decimal
 *  with at most eight places. */
export function toUnits(raw: string | null | undefined): bigint | null {
  const text = (raw ?? "").trim();
  if (!DECIMAL.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > PLACES) return null;
  return BigInt(whole) * ONE + BigInt(fraction.padEnd(PLACES, "0") || "0");
}

/** Units back to a decimal string, trailing zeros removed. */
export function fromUnits(units: bigint): string {
  const negative = units < ZERO;
  const abs = negative ? -units : units;
  const fraction = (abs % ONE).toString().padStart(PLACES, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${abs / ONE}${fraction ? `.${fraction}` : ""}`;
}

/**
 * The share of the recorded markup that a payout covers, as units of one
 * (100000000n is all of it). Mirrors `settlement_ratio` in wallet-service:
 * capped at one, rounded down, and one when nothing was recorded.
 */
export function shareOf(paid: bigint, expected: bigint): bigint {
  if (expected <= ZERO || paid >= expected) return ONE;
  return (paid * ONE) / expected;
}

/** That share of an amount, rounded down. */
export function applyShare(amount: bigint, share: bigint): bigint {
  return share >= ONE ? amount : (amount * share) / ONE;
}

/** "1234567.5" to "1,234,567.50": grouped, at least two places, never
 *  rounded. A value that is not a decimal is shown as a dash, not as zero. */
export function formatAmount(raw: string | null | undefined): string {
  const units = toUnits(raw);
  if (units === null) return "—";
  const [whole, fraction = ""] = fromUnits(units).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`;
}

/** A share as a percentage with up to two places, rounded down: a payout is
 *  never described as covering more than it does. */
export function formatShare(share: bigint): string {
  const hundredths = (share * BigInt(10000)) / ONE;
  const whole = hundredths / BigInt(100);
  const fraction = (hundredths % BigInt(100)).toString().padStart(2, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}%`;
}

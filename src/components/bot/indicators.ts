/**
 * Indicator maths for the dBot chart.
 *
 * A deliberate mirror of `internal/marketdata/indicators.go` in the trading
 * engine — same periods, same Wilder smoothing for RSI, same population
 * standard deviation for Bollinger. The bot decides on the backend's numbers;
 * if these drifted, the user would watch a chart that disagreed with the trades
 * being placed in front of them.
 *
 * Each function returns an array aligned to the input, with `null` in the
 * leading positions where there is not enough history. Null rather than 0 for
 * the same reason as the Go side: a zero would plot as a real value.
 */

export function sma(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0) return out;

  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= period) sum -= closes[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export interface BollingerSeries {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function bollinger(
  closes: number[],
  period = 20,
  stdDevs = 2,
): BollingerSeries {
  const middle = sma(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = 0; i < closes.length; i++) {
    const mean = middle[i];
    if (mean === null) continue;

    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - mean;
      sumSq += d * d;
    }
    // Population deviation (÷n), matching the Go implementation. The sample
    // form would widen every band by sqrt(n/(n-1)).
    const sd = Math.sqrt(sumSq / period);
    upper[i] = mean + stdDevs * sd;
    lower[i] = mean - stdDevs * sd;
  }

  return { upper, middle, lower };
}

export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period + 1) return out;

  // Seed: simple mean of the first `period` changes.
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gainSum += d;
    else lossSum -= d;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = toRsi(avgGain, avgLoss);

  // Wilder smoothing forward.
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = toRsi(avgGain, avgLoss);
  }

  return out;
}

function toRsi(avgGain: number, avgLoss: number): number {
  // Guarded explicitly: the division would otherwise yield NaN/Infinity on a
  // flat or one-directional window and poison every comparison downstream.
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

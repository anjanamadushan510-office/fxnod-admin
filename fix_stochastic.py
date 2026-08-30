import re

file_path = r"E:\ajantha\fxnod-frontend\src\lib\indicators.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the stochastic section
start_marker = "// Stochastic Oscillator (%K and %D)"
end_marker = "// Commodity Channel Index (CCI)"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find markers!")
    print(f"start_marker found: {start_idx != -1}")
    print(f"end_marker found: {end_idx != -1}")
    exit(1)

new_stochastic = '''// Stochastic Oscillator (%K and %D)
export interface StochasticResult {
  k: number[];
  d: number[];
}

export function calculateStochastic(
  high: number[],
  low: number[],
  close: number[],
  periodK: number,
  periodD: number,
  smoothing: number = 3
): StochasticResult {
  const n = close.length;

  // Step 1: Calculate raw Fast %K
  const rawK: number[] = new Array(n).fill(NaN);
  for (let i = periodK - 1; i < n; i++) {
    let hh = high[i - periodK + 1];
    let ll = low[i - periodK + 1];
    for (let j = i - periodK + 2; j <= i; j++) {
      if (high[j] > hh) hh = high[j];
      if (low[j] < ll) ll = low[j];
    }
    rawK[i] = (hh !== ll) ? ((close[i] - ll) / (hh - ll)) * 100 : 50;
  }

  // Step 2: Smooth %K (Slow %K) using SMA of smoothing period, index-aligned
  const slowK: number[] = new Array(n).fill(NaN);
  if (smoothing <= 1) {
    for (let i = 0; i < n; i++) slowK[i] = rawK[i];
  } else {
    for (let i = 0; i < n; i++) {
      if (i < periodK - 1 + smoothing - 1) continue;
      let sum = 0;
      let count = 0;
      for (let j = 0; j < smoothing; j++) {
        const val = rawK[i - j];
        if (!isNaN(val)) { sum += val; count++; }
      }
      if (count === smoothing) slowK[i] = sum / smoothing;
    }
  }

  // Step 3: %D = SMA(periodD) of slowK, index-aligned
  const slowD: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < periodD; j++) {
      if (i - j < 0) break;
      const val = slowK[i - j];
      if (!isNaN(val)) { sum += val; count++; }
    }
    if (count === periodD) slowD[i] = sum / periodD;
  }

  return { k: slowK, d: slowD };
}

'''

new_content = content[:start_idx] + new_stochastic + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Patched successfully!")

import re

file_path = r"E:\ajantha\fxnod-frontend\src\lib\indicators.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "// Stochastic Oscillator (%K and %D)"
end_marker = "// Commodity Channel Index (CCI)"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find markers!")
    exit(1)

original_stochastic = '''// Stochastic Oscillator (%K and %D)
export interface StochasticResult {
  k: number[];
  d: number[];
}

export function calculateStochastic(high: number[], low: number[], close: number[], periodK: number, periodD: number, smoothing: number = 3): StochasticResult {
  const fastK: number[] = new Array(close.length).fill(NaN);
  for (let i = periodK - 1; i < close.length; i++) {
    let highestHigh = high[i - periodK + 1];
    let lowestLow = low[i - periodK + 1];
    
    for (let j = 1; j < periodK; j++) {
      const idx = i - periodK + 1 + j;
      if (high[idx] > highestHigh) highestHigh = high[idx];
      if (low[idx] < lowestLow) lowestLow = low[idx];
    }

    if (highestHigh !== lowestLow) {
      fastK[i] = ((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
    } else {
      fastK[i] = 50;
    }
  }

  // 1. Extract valid fastK
  const validFastK: number[] = [];
  const validFastKIndices: number[] = [];
  for (let i = 0; i < fastK.length; i++) {
    if (!isNaN(fastK[i])) {
      validFastK.push(fastK[i]);
      validFastKIndices.push(i);
    }
  }

  // 2. Smooth to get slowK
  let slowKValues = validFastK;
  if (smoothing > 1) {
    slowKValues = calculateSMA(validFastK, smoothing);
  }

  // 3. Extract valid slowK for %D calculation
  const validSlowK: number[] = [];
  const validSlowKIndices: number[] = [];
  for (let i = 0; i < slowKValues.length; i++) {
    if (!isNaN(slowKValues[i])) {
      validSlowK.push(slowKValues[i]);
      validSlowKIndices.push(validFastKIndices[i]);
    }
  }

  // 4. Calculate %D
  const dValues = calculateSMA(validSlowK, periodD);

  // 5. Map back to original length arrays
  const finalK: number[] = new Array(close.length).fill(NaN);
  const finalD: number[] = new Array(close.length).fill(NaN);

  for (let i = 0; i < slowKValues.length; i++) {
    if (!isNaN(slowKValues[i])) {
      finalK[validFastKIndices[i]] = slowKValues[i];
    }
  }

  for (let i = 0; i < dValues.length; i++) {
    if (!isNaN(dValues[i])) {
      finalD[validSlowKIndices[i]] = dValues[i];
    }
  }

  return { k: finalK, d: finalD };
}

'''

new_content = content[:start_idx] + original_stochastic + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Reverted to original calculateStochastic successfully!")

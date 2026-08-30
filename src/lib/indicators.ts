/**
 * Mathematical calculations for Chart Indicators.
 * These are simple pure functions designed to work incrementally
 * or over historical data arrays to feed lightweight-charts.
 */

// Supertrend
export function calculateSupertrend(
  high: number[],
  low: number[],
  close: number[],
  period: number = 10,
  multiplier: number = 3
) {
  const result = {
    trend: new Array(close.length).fill(NaN),
    up: new Array(close.length).fill(NaN),
    down: new Array(close.length).fill(NaN),
  };

  if (close.length <= period) return result;

  const atr = new Array(close.length).fill(0);
  let trSum = 0;

  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    trSum += tr;
    atr[i] = trSum / i; // simple average initially
  }

  for (let i = period + 1; i < close.length; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    // Wilder's Smoothing for ATR
    atr[i] = (atr[i - 1] * (period - 1) + tr) / period;
  }

  let finalUpper = new Array(close.length).fill(0);
  let finalLower = new Array(close.length).fill(0);

  for (let i = period; i < close.length; i++) {
    const hl2 = (high[i] + low[i]) / 2;
    const basicUpper = hl2 + multiplier * atr[i];
    const basicLower = hl2 - multiplier * atr[i];

    if (i === period) {
      finalUpper[i] = basicUpper;
      finalLower[i] = basicLower;
      result.trend[i] = 1; // start up
    } else {
      finalUpper[i] = (basicUpper < finalUpper[i - 1] || close[i - 1] > finalUpper[i - 1]) 
        ? basicUpper 
        : finalUpper[i - 1];
        
      finalLower[i] = (basicLower > finalLower[i - 1] || close[i - 1] < finalLower[i - 1]) 
        ? basicLower 
        : finalLower[i - 1];

      if (result.trend[i - 1] === 1) {
        result.trend[i] = close[i] < finalLower[i] ? -1 : 1;
      } else {
        result.trend[i] = close[i] > finalUpper[i] ? 1 : -1;
      }
    }
    
    result.up[i] = finalLower[i]; // When trend is 1, it follows finalLower
    result.down[i] = finalUpper[i]; // When trend is -1, it follows finalUpper
  }

  return result;
}

// Simple Moving Average (SMA)
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period] + data[i];
    result[i] = sum / period;
  }
  return result;
}

// Exponential Moving Average (EMA)
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Initial SMA for the first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }
  
  return result;
}

// Relative Strength Index (RSI)
export function calculateRSI(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length <= period) return result;

  let gainSum = 0;
  let lossSum = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

// Moving Average Convergence Divergence (MACD)
export function calculateMACD(data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): MACDResult {
  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);

  const macdLine: number[] = new Array(data.length).fill(NaN);
  const validMacdValues: number[] = [];
  const validMacdIndices: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (!isNaN(fastEma[i]) && !isNaN(slowEma[i])) {
      const val = fastEma[i] - slowEma[i];
      macdLine[i] = val;
      validMacdValues.push(val);
      validMacdIndices.push(i);
    }
  }

  // Calculate signal line which is EMA of MACD line
  const signalEma = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: number[] = new Array(data.length).fill(NaN);
  const histogram: number[] = new Array(data.length).fill(NaN);

  for (let i = 0; i < validMacdValues.length; i++) {
    const originalIndex = validMacdIndices[i];
    if (!isNaN(signalEma[i])) {
      signalLine[originalIndex] = signalEma[i];
      histogram[originalIndex] = macdLine[originalIndex] - signalLine[originalIndex];
    }
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram,
  };
}

// Rate of Change (ROC)
export function calculateROC(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period; i < data.length; i++) {
    const pastPrice = data[i - period];
    if (pastPrice !== 0) {
      result[i] = ((data[i] - pastPrice) / pastPrice) * 100;
    }
  }
  return result;
}

// Awesome Oscillator (AO)
export function calculateAwesomeOscillator(high: number[], low: number[]): number[] {
  const result: number[] = new Array(high.length).fill(NaN);
  const medianPrices: number[] = new Array(high.length).fill(0);
  for (let i = 0; i < high.length; i++) {
    medianPrices[i] = (high[i] + low[i]) / 2;
  }
  
  const sma5 = calculateSMA(medianPrices, 5);
  const sma34 = calculateSMA(medianPrices, 34);

  for (let i = 0; i < high.length; i++) {
    if (!isNaN(sma5[i]) && !isNaN(sma34[i])) {
      result[i] = sma5[i] - sma34[i];
    }
  }
  return result;
}

// William's Percent Range (%R)
export function calculateWilliamsR(high: number[], low: number[], close: number[], period: number): number[] {
  const result: number[] = new Array(close.length).fill(NaN);
  for (let i = period - 1; i < close.length; i++) {
    let highestHigh = high[i - period + 1];
    let lowestLow = low[i - period + 1];
    
    for (let j = 1; j < period; j++) {
      const idx = i - period + 1 + j;
      if (high[idx] > highestHigh) highestHigh = high[idx];
      if (low[idx] < lowestLow) lowestLow = low[idx];
    }

    if (highestHigh !== lowestLow) {
      result[i] = ((highestHigh - close[i]) / (highestHigh - lowestLow)) * -100;
    } else {
      result[i] = -50;
    }
  }
  return result;
}

// Stochastic Oscillator (%K and %D)
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

// Commodity Channel Index (CCI)
export function calculateCCI(high: number[], low: number[], close: number[], period: number): number[] {
  const result: number[] = new Array(close.length).fill(NaN);
  const tp: number[] = new Array(close.length).fill(0);
  
  for (let i = 0; i < close.length; i++) {
    tp[i] = (high[i] + low[i] + close[i]) / 3;
  }

  const smaTp = calculateSMA(tp, period);

  for (let i = period - 1; i < close.length; i++) {
    if (isNaN(smaTp[i])) continue;
    
    let sumDev = 0;
    for (let j = 0; j < period; j++) {
      sumDev += Math.abs(tp[i - j] - smaTp[i]);
    }
    const meanDev = sumDev / period;
    
    if (meanDev !== 0) {
      result[i] = (tp[i] - smaTp[i]) / (0.015 * meanDev);
    } else {
      result[i] = 0;
    }
  }

  return result;
}

// =====================================
// Trend Indicators
// =====================================

export interface AroonResult {
  up: number[];
  down: number[];
}

export function calculateAroon(high: number[], low: number[], period: number): AroonResult {
  const up: number[] = new Array(high.length).fill(NaN);
  const down: number[] = new Array(high.length).fill(NaN);

  for (let i = period; i < high.length; i++) {
    let highestHigh = high[i - period];
    let highestIndex = i - period;
    let lowestLow = low[i - period];
    let lowestIndex = i - period;

    for (let j = 0; j <= period; j++) {
      const idx = i - period + j;
      if (high[idx] >= highestHigh) {
        highestHigh = high[idx];
        highestIndex = idx;
      }
      if (low[idx] <= lowestLow) {
        lowestLow = low[idx];
        lowestIndex = idx;
      }
    }

    up[i] = ((period - (i - highestIndex)) / period) * 100;
    down[i] = ((period - (i - lowestIndex)) / period) * 100;
  }
  return { up, down };
}

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

// Wilder's Smoothing (RMA) used in ADX
function calculateRMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  
  // Find first non-NaN index
  let firstValidIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (!isNaN(data[i])) {
      firstValidIdx = i;
      break;
    }
  }
  
  if (firstValidIdx === -1 || data.length - firstValidIdx < period) return result;

  let sum = 0;
  for (let i = firstValidIdx; i < firstValidIdx + period; i++) sum += data[i];
  result[firstValidIdx + period - 1] = sum / period;

  for (let i = firstValidIdx + period; i < data.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + data[i]) / period;
  }
  return result;
}

export function calculateADX(high: number[], low: number[], close: number[], period: number, smoothingPeriod?: number): ADXResult {
  const tr: number[] = new Array(high.length).fill(0);
  const plusDM: number[] = new Array(high.length).fill(0);
  const minusDM: number[] = new Array(high.length).fill(0);

  for (let i = 1; i < high.length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];

    plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
    minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;

    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(tr1, tr2, tr3);
  }

  const smoothTR = calculateRMA(tr, period);
  const smoothPlusDM = calculateRMA(plusDM, period);
  const smoothMinusDM = calculateRMA(minusDM, period);

  const plusDI: number[] = new Array(high.length).fill(NaN);
  const minusDI: number[] = new Array(high.length).fill(NaN);
  const dx: number[] = new Array(high.length).fill(NaN);

  for (let i = period; i < high.length; i++) {
    if (smoothTR[i] > 0) {
      plusDI[i] = (smoothPlusDM[i] / smoothTR[i]) * 100;
      minusDI[i] = (smoothMinusDM[i] / smoothTR[i]) * 100;
    } else {
      plusDI[i] = 0;
      minusDI[i] = 0;
    }
    const sumDI = plusDI[i] + minusDI[i];
    dx[i] = sumDI === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / sumDI) * 100;
  }

  const adx = calculateRMA(dx, smoothingPeriod ?? period);

  return { adx, plusDI, minusDI };
}

export interface IchimokuResult {
  tenkan: number[];
  kijun: number[];
  senkouA: number[];
  senkouB: number[];
  chikou: number[];
}

function getDonchianMiddle(high: number[], low: number[], index: number, period: number): number {
  if (index < period - 1) return NaN;
  let hh = high[index];
  let ll = low[index];
  for (let i = 1; i < period; i++) {
    hh = Math.max(hh, high[index - i]);
    ll = Math.min(ll, low[index - i]);
  }
  return (hh + ll) / 2;
}

export function calculateIchimoku(high: number[], low: number[], close: number[], tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52): IchimokuResult {
  const len = close.length;
  const tenkan: number[] = new Array(len).fill(NaN);
  const kijun: number[] = new Array(len).fill(NaN);
  // We don't pad the arrays with future data here. 
  // senkouA and senkouB represent their values WITHOUT shifting logic applied in the array index.
  // The shifting logic will be applied when mounting to lightweight-charts (or shifting the array).
  const senkouA: number[] = new Array(len).fill(NaN);
  const senkouB: number[] = new Array(len).fill(NaN);
  const chikou: number[] = new Array(len).fill(NaN);

  for (let i = 0; i < len; i++) {
    tenkan[i] = getDonchianMiddle(high, low, i, tenkanPeriod);
    kijun[i] = getDonchianMiddle(high, low, i, kijunPeriod);
    
    if (!isNaN(tenkan[i]) && !isNaN(kijun[i])) {
      senkouA[i] = (tenkan[i] + kijun[i]) / 2;
    }
    senkouB[i] = getDonchianMiddle(high, low, i, senkouBPeriod);
    chikou[i] = close[i];
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
}

export function calculateParabolicSAR(high: number[], low: number[], step = 0.02, maxStep = 0.2): number[] {
  const len = high.length;
  const sar: number[] = new Array(len).fill(NaN);
  if (len < 2) return sar;

  let isLong = true;
  let af = step;
  let ep = high[0];
  let curSAR = low[0];
  
  sar[0] = curSAR;

  for (let i = 1; i < len; i++) {
    const prevSAR = curSAR;
    let nextSAR = prevSAR + af * (ep - prevSAR);

    if (isLong) {
      if (low[i] < nextSAR) {
        // Trend reversal
        isLong = false;
        nextSAR = Math.max(ep, high[i]);
        ep = low[i];
        af = step;
      } else {
        if (high[i] > ep) {
          ep = high[i];
          af = Math.min(af + step, maxStep);
        }
        if (i >= 2) nextSAR = Math.min(nextSAR, low[i - 1], low[i - 2]);
        else if (i >= 1) nextSAR = Math.min(nextSAR, low[i - 1]);
      }
    } else {
      if (high[i] > nextSAR) {
        // Trend reversal
        isLong = true;
        nextSAR = Math.min(ep, low[i]);
        ep = high[i];
        af = step;
      } else {
        if (low[i] < ep) {
          ep = low[i];
          af = Math.min(af + step, maxStep);
        }
        if (i >= 2) nextSAR = Math.max(nextSAR, high[i - 1], high[i - 2]);
        else if (i >= 1) nextSAR = Math.max(nextSAR, high[i - 1]);
      }
    }

    curSAR = nextSAR;
    sar[i] = curSAR;
  }
  return sar;
}

export function calculateZigZag(high: number[], low: number[], close: number[], deviation = 5): number[] {
  const len = high.length;
  const zigzag: number[] = new Array(len).fill(NaN);
  if (len === 0) return zigzag;

  const devPct = deviation / 100;
  let lastPeak = high[0];
  let lastTrough = low[0];
  let isUpTrend = true;
  let lastPivotIdx = 0;
  
  for (let i = 1; i < len; i++) {
    if (isUpTrend) {
      if (high[i] > lastPeak) {
        lastPeak = high[i];
        lastPivotIdx = i;
      } else if (low[i] < lastPeak * (1 - devPct)) {
        zigzag[lastPivotIdx] = lastPeak; // confirm peak
        isUpTrend = false;
        lastTrough = low[i];
        lastPivotIdx = i;
      }
    } else {
      if (low[i] < lastTrough) {
        lastTrough = low[i];
        lastPivotIdx = i;
      } else if (high[i] > lastTrough * (1 + devPct)) {
        zigzag[lastPivotIdx] = lastTrough; // confirm trough
        isUpTrend = true;
        lastPeak = high[i];
        lastPivotIdx = i;
      }
    }
  }
  
  if (isUpTrend) {
    zigzag[lastPivotIdx] = lastPeak;
  } else {
    zigzag[lastPivotIdx] = lastTrough;
  }

  // Add dynamic tentative point to the current candle
  if (lastPivotIdx !== len - 1 && len > 0) {
    zigzag[len - 1] = close[len - 1];
  }

  return zigzag;
}
export interface BollingerBandsResult { upper: number[]; middle: number[]; lower: number[]; }
export function calculateBollingerBands(data: number[], period: number = 20, stdDevMultiplier: number = 2, maType: string = "Simple"): BollingerBandsResult {
  const result: BollingerBandsResult = { upper: new Array(data.length).fill(NaN), middle: new Array(data.length).fill(NaN), lower: new Array(data.length).fill(NaN) };
  let ma: number[];
  if (maType === "Exponential") ma = calculateEMA(data, period);
  else if (maType === "Weighted") ma = calculateWMA(data, period);
  else if (maType === "Hull") ma = calculateHMA(data, period);
  else if (maType === "Zero Lag") ma = calculateZLEMA(data, period);
  else if (maType === "Time Series") ma = calculateTimeSeries(data, period);
  else ma = calculateSMA(data, period);

  for (let i = period - 1; i < data.length; i++) {
    const middleValue = ma[i];
    
    // Standard deviation is always calculated using the simple mean (SMA) of the window
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    const simpleMean = sum / period;
    
    let sumSqrDiffs = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j] - simpleMean;
      sumSqrDiffs += diff * diff;
    }
    const stdDev = Math.sqrt(sumSqrDiffs / period);
    
    result.middle[i] = middleValue;
    result.upper[i] = middleValue + (stdDevMultiplier * stdDev);
    result.lower[i] = middleValue - (stdDevMultiplier * stdDev);
  }
  return result;
}

export interface DonchianChannelResult { upper: number[]; middle: number[]; lower: number[]; }
export function calculateDonchianChannel(high: number[], low: number[], highPeriod: number = 20, lowPeriod: number = 20): DonchianChannelResult {
  const result: DonchianChannelResult = { upper: new Array(high.length).fill(NaN), middle: new Array(high.length).fill(NaN), lower: new Array(high.length).fill(NaN) };
  
  for (let i = 0; i < high.length; i++) {
    let highestHigh = NaN;
    if (i >= highPeriod - 1) {
      highestHigh = -Infinity;
      for (let j = 0; j < highPeriod; j++) {
        if (high[i - j] > highestHigh) highestHigh = high[i - j];
      }
    }
    
    let lowestLow = NaN;
    if (i >= lowPeriod - 1) {
      lowestLow = Infinity;
      for (let j = 0; j < lowPeriod; j++) {
        if (low[i - j] < lowestLow) lowestLow = low[i - j];
      }
    }
    
    result.upper[i] = highestHigh;
    result.lower[i] = lowestLow;
    if (!isNaN(highestHigh) && !isNaN(lowestLow)) {
      result.middle[i] = (highestHigh + lowestLow) / 2;
    }
  }
  return result;
}

export function calculateWMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  
  const denominator = (period * (period + 1)) / 2;
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      const weight = period - j;
      sum += data[i - j] * weight;
    }
    result[i] = sum / denominator;
  }
  return result;
}

export function calculateMA(data: number[], period: number, maType: string, offset: number = 0): number[] {
  let ma: number[];
  if (maType === "SMA" || maType === "Simple") ma = calculateSMA(data, period);
  else if (maType === "EMA" || maType === "Exponential") ma = calculateEMA(data, period);
  else if (maType === "WMA" || maType === "Weighted") ma = calculateWMA(data, period);
  else if (maType === "Hull") ma = calculateHMA(data, period);
  else if (maType === "Zero Lag") ma = calculateZLEMA(data, period);
  else if (maType === "Time Series") ma = calculateTimeSeries(data, period);
  else ma = calculateSMA(data, period);

  if (offset === 0) return ma;

  const result = new Array(data.length).fill(NaN);
  for (let i = 0; i < data.length; i++) {
    const targetIdx = i + offset;
    if (targetIdx >= 0 && targetIdx < data.length) {
      result[targetIdx] = ma[i];
    }
  }
  return result;
}

export function calculateHMA(data: number[], period: number): number[] {
  const halfLength = Math.floor(period / 2);
  const sqrtLength = Math.round(Math.sqrt(period));
  
  const wmaHalf = calculateWMA(data, halfLength);
  const wmaFull = calculateWMA(data, period);
  
  const rawHma = new Array(data.length).fill(NaN);
  for (let i = 0; i < data.length; i++) {
    if (!isNaN(wmaHalf[i]) && !isNaN(wmaFull[i])) {
      rawHma[i] = (2 * wmaHalf[i]) - wmaFull[i];
    }
  }
  
  return calculateWMA(rawHma, sqrtLength);
}

export function calculateZLEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  
  const lag = Math.round((period - 1) / 2);
  const zData = new Array(data.length).fill(NaN);
  
  for (let i = lag; i < data.length; i++) {
    zData[i] = data[i] + (data[i] - data[i - lag]);
  }
  
  const ema = calculateEMA(zData.slice(lag), period);
  for (let i = lag; i < data.length; i++) {
    result[i] = ema[i - lag];
  }
  
  return result;
}

export function calculateTimeSeries(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  
  for (let i = period - 1; i < data.length; i++) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let j = 0; j < period; j++) {
      const x = j;
      const y = data[i - (period - 1 - j)];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    const m = (period * sumXY - sumX * sumY) / (period * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / period;
    // Evaluate at current point which is `period - 1`
    result[i] = m * (period - 1) + b;
  }
  
  return result;
}

export interface MAEnvelopeResult {
  middle: number[];
  upper: number[];
  lower: number[];
}

export function calculateMAEnvelope(data: number[], period: number, maType: string, shift: number, shiftType: string): MAEnvelopeResult {
  let middle: number[] = [];
  if (maType === "SMA" || maType === "Simple") middle = calculateSMA(data, period);
  else if (maType === "EMA" || maType === "Exponential") middle = calculateEMA(data, period);
  else if (maType === "WMA" || maType === "Weighted") middle = calculateWMA(data, period);
  else if (maType === "Hull") middle = calculateHMA(data, period);
  else if (maType === "Zero Lag") middle = calculateZLEMA(data, period);
  else if (maType === "Time Series") middle = calculateTimeSeries(data, period);
  else middle = calculateSMA(data, period);

  const upper: number[] = new Array(data.length).fill(NaN);
  const lower: number[] = new Array(data.length).fill(NaN);

  for (let i = 0; i < data.length; i++) {
    if (!isNaN(middle[i])) {
      if (shiftType === "percent") {
        upper[i] = middle[i] * (1 + shift / 100);
        lower[i] = middle[i] * (1 - shift / 100);
      } else {
        upper[i] = middle[i] + shift;
        lower[i] = middle[i] - shift;
      }
    }
  }

  return { middle, upper, lower };
}

export function calculateRainbowMA(data: number[], period: number, maType: string): number[][] {
  const lines: number[][] = [];
  const numLines = 10;
  
  let currentData = [...data];
  
  for (let k = 0; k < numLines; k++) {
    // Find first valid index (skip leading NaNs)
    let firstValid = 0;
    while (firstValid < currentData.length && isNaN(currentData[firstValid])) {
      firstValid++;
    }
    
    if (firstValid >= currentData.length) {
      lines.push([...currentData]);
      continue;
    }
    
    const validData = currentData.slice(firstValid);
    let result: number[];
    
    if (maType === "SMA" || maType === "Simple") result = calculateSMA(validData, period);
    else if (maType === "EMA" || maType === "Exponential") result = calculateEMA(validData, period);
    else if (maType === "WMA" || maType === "Weighted") result = calculateWMA(validData, period);
    else if (maType === "Hull") result = calculateHMA(validData, period);
    else if (maType === "Zero Lag") result = calculateZLEMA(validData, period);
    else if (maType === "Time Series") result = calculateTimeSeries(validData, period);
    else result = calculateSMA(validData, period);
    
    // Re-pad with NaNs at the beginning
    const nextLine = new Array(firstValid).fill(NaN).concat(result);
    
    lines.push(nextLine);
    
    // The next line uses the current smoothed line as its input
    currentData = nextLine;
  }
  
  return lines;
}

// Smoothed Moving Average (SMMA)
export function calculateSMMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  let firstValid = 0;
  while(firstValid < data.length && isNaN(data[firstValid])) firstValid++;
  if (data.length - firstValid < period) return result;

  let sum = 0;
  for (let i = firstValid; i < firstValid + period; i++) {
    sum += data[i];
  }
  result[firstValid + period - 1] = sum / period;

  for (let i = firstValid + period; i < data.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + data[i]) / period;
  }
  return result;
}

// Alligator Indicator
export function calculateAlligator(
  high: number[], 
  low: number[], 
  jawP: number = 13, 
  jawS: number = 8, 
  teethP: number = 8, 
  teethS: number = 5, 
  lipsP: number = 5, 
  lipsS: number = 3
): { jaw: number[], teeth: number[], lips: number[] } {
  const median = high.map((h, i) => (h + low[i]) / 2);
  
  const jawSMMA = calculateSMMA(median, jawP);
  const teethSMMA = calculateSMMA(median, teethP);
  const lipsSMMA = calculateSMMA(median, lipsP);
  
  // Return the unshifted lines. Shifting is handled in the renderer to project into the future.
  return { jaw: jawSMMA, teeth: teethSMMA, lips: lipsSMMA };
}

// Fractal Chaos Bands
export function calculateFractalChaosBands(high: number[], low: number[], lookback: number = 5): { upper: number[], lower: number[] } {
  const upper = new Array(high.length).fill(NaN);
  const lower = new Array(low.length).fill(NaN);
  
  let currentUpper = NaN;
  let currentLower = NaN;
  const n = Math.floor(lookback / 2);
  
  for (let i = lookback - 1; i < high.length; i++) {
    const centerIdx = i - n;
    let isUpFractal = true;
    let isDownFractal = true;
    
    for (let j = 0; j < lookback; j++) {
      const idx = i - lookback + 1 + j;
      if (idx !== centerIdx) {
        if (high[idx] >= high[centerIdx]) isUpFractal = false;
        if (low[idx] <= low[centerIdx]) isDownFractal = false;
      }
    }
    
    if (isUpFractal) currentUpper = high[centerIdx];
    if (isDownFractal) currentLower = low[centerIdx];
    
    upper[i] = currentUpper;
    lower[i] = currentLower;
  }
  
  return { upper, lower };
}

export function calculateDPO(data: number[], period: number = 21, maType: string = "Simple"): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  
  // Standard DPO formula: Price[i] - SMA[i - (period/2 + 1)]
  // The SMA is displaced backwards by (period/2 + 1) bars
  // This removes the long-term trend and isolates short-term price cycles
  const ma = calculateMA(data, period, maType);
  const barsback = Math.floor(period / 2) + 1;
  
  for (let i = barsback; i < data.length; i++) {
    const displacedMA = ma[i - barsback];
    if (!isNaN(displacedMA)) {
      result[i] = data[i] - displacedMA;
    }
  }
  
  return result;
}

export interface SMIResult {
  smi: number[];
  signal: number[];
}

export function calculateSMI(
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 10, 
  smoothing1: number = 3, 
  smoothing2: number = 3, 
  signalPeriod: number = 10, 
  maType: string = "Exponential"
): SMIResult {
  const dataLen = close.length;
  const smiLine = new Array(dataLen).fill(NaN);
  const signalLine = new Array(dataLen).fill(NaN);
  
  if (dataLen < period) return { smi: smiLine, signal: signalLine };
  
  const mArr = new Array(dataLen).fill(NaN);
  const hlArr = new Array(dataLen).fill(NaN);
  
  for (let i = period - 1; i < dataLen; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = 0; j < period; j++) {
      if (high[i - j] > hh) hh = high[i - j];
      if (low[i - j] < ll) ll = low[i - j];
    }
    const center = (hh + ll) / 2;
    mArr[i] = close[i] - center;
    hlArr[i] = hh - ll;
  }
  
  // Extract valid arrays to avoid NaN poisoning the MA calculation if necessary.
  // Actually, calculateMA skips NaNs at the beginning, but if we pass an array with initial NaNs, 
  // it might assume the period starts from index 0. 
  // Let's strip the initial NaNs and pad the result.
  const stripNaNs = (arr: number[]) => {
    let firstValid = 0;
    while (firstValid < arr.length && isNaN(arr[firstValid])) {
      firstValid++;
    }
    return { validData: arr.slice(firstValid), offset: firstValid };
  };

  const padResult = (validData: number[], offset: number, totalLen: number) => {
    return new Array(offset).fill(NaN).concat(validData).concat(new Array(totalLen - offset - validData.length).fill(NaN));
  };

  const mData = stripNaNs(mArr);
  const hlData = stripNaNs(hlArr);

  // Smooth M
  const mEMA1 = calculateMA(mData.validData, smoothing1, 'Exponential');
  const mEMA1Strip = stripNaNs(mEMA1);
  const mEMA2 = calculateMA(mEMA1Strip.validData, smoothing2, 'Exponential');
  
  // Smooth HL
  const hlEMA1 = calculateMA(hlData.validData, smoothing1, 'Exponential');
  const hlEMA1Strip = stripNaNs(hlEMA1);
  const hlEMA2 = calculateMA(hlEMA1Strip.validData, smoothing2, 'Exponential');

  // Combine and calculate SMI
  const mSmoothed = padResult(mEMA2, mData.offset + mEMA1Strip.offset, dataLen);
  const hlSmoothed = padResult(hlEMA2, hlData.offset + hlEMA1Strip.offset, dataLen);

  for (let i = 0; i < dataLen; i++) {
    if (!isNaN(mSmoothed[i]) && !isNaN(hlSmoothed[i]) && hlSmoothed[i] !== 0) {
      smiLine[i] = 100 * (mSmoothed[i] / (0.5 * hlSmoothed[i]));
    }
  }

  // Calculate Signal
  const smiData = stripNaNs(smiLine);
  if (smiData.validData.length > 0) {
    const signalMA = calculateMA(smiData.validData, signalPeriod, maType);
    const paddedSignal = padResult(signalMA, smiData.offset, dataLen);
    for (let i = 0; i < dataLen; i++) {
      signalLine[i] = paddedSignal[i];
    }
  }

  return { smi: smiLine, signal: signalLine };
}

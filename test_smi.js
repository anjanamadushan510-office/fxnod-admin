const fs = require('fs');

function calculateSMA(data, period) {
  const result = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j];
    result[i] = sum / period;
  }
  return result;
}

function calculateEMA(data, period) {
  const result = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  
  const multiplier = 2 / (period + 1);
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

function calculateMA(data, period, maType) {
  if (maType === "Exponential") return calculateEMA(data, period);
  return calculateSMA(data, period);
}

function calculateSMI(
  high, 
  low, 
  close, 
  period = 10, 
  smoothing1 = 3, 
  smoothing2 = 3, 
  signalPeriod = 10, 
  maType = "Exponential"
) {
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
  
  const stripNaNs = (arr) => {
    let firstValid = 0;
    while (firstValid < arr.length && isNaN(arr[firstValid])) {
      firstValid++;
    }
    return { validData: arr.slice(firstValid), offset: firstValid };
  };

  const padResult = (validData, offset, totalLen) => {
    const p1 = new Array(offset).fill(NaN);
    const p2 = new Array(Math.max(0, totalLen - offset - validData.length)).fill(NaN);
    return p1.concat(validData).concat(p2);
  };

  const mData = stripNaNs(mArr);
  const hlData = stripNaNs(hlArr);

  const mEMA1 = calculateMA(mData.validData, smoothing1, maType);
  const mEMA1Strip = stripNaNs(mEMA1);
  const mEMA2 = calculateMA(mEMA1Strip.validData, smoothing2, maType);
  
  const hlEMA1 = calculateMA(hlData.validData, smoothing1, maType);
  const hlEMA1Strip = stripNaNs(hlEMA1);
  const hlEMA2 = calculateMA(hlEMA1Strip.validData, smoothing2, maType);

  const mSmoothed = padResult(mEMA2, mData.offset + mEMA1Strip.offset, dataLen);
  const hlSmoothed = padResult(hlEMA2, hlData.offset + hlEMA1Strip.offset, dataLen);

  for (let i = 0; i < dataLen; i++) {
    if (!isNaN(mSmoothed[i]) && !isNaN(hlSmoothed[i]) && hlSmoothed[i] !== 0) {
      smiLine[i] = 100 * (mSmoothed[i] / (0.5 * hlSmoothed[i]));
    }
  }

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

const high = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20, 21,22,23,24,25,26,27,28,29,30];
const low = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20, 21,22,23,24,25,26,27,28,29,30];
const close = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20, 21,22,23,24,25,26,27,28,29,30];
try {
  const res = calculateSMI(high, low, close, 10, 3, 3, 10, 'Exponential');
  console.log('Success:', res.smi.slice(-5));
} catch (e) {
  console.log('Error:', e);
}

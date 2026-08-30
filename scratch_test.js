const fs = require('fs');

function calculateSMA(data, period) {
  const result = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  result[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period] + data[i];
    result[i] = sum / period;
  }
  return result;
}

const data = [];
let price = 830;
for (let i = 0; i < 50; i++) { data.push(price); price -= 0.1; }
for (let i = 0; i < 10; i++) { price -= 1; data.push(price); }
for (let i = 0; i < 5; i++) { price += 0.5; data.push(price); }
data.push(823.79);

console.log("Multiplicative Period Method (Period * k):");
for (let k = 1; k <= 10; k++) {
    const period = 2 * k;
    const result = calculateSMA(data, period);
    console.log(`SMA${k} (p=${period}): ${result[result.length - 1].toFixed(2)}`);
}

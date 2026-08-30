import { calculateSMI } from '../src/lib/indicators.ts';

const close = [];
const high = [];
const low = [];
for(let i=0; i<100; i++) {
  const val = 100 + Math.sin(i)*10;
  close.push(val);
  high.push(val);
  low.push(val);
}

try {
  const q = "10";
  const r = "3";
  const s = "3";
  const sig = "10";
  const maType = 'Exponential';
  
  const res = calculateSMI(high, low, close, q, r, s, sig, maType);
  const smiData = res.smi.filter(d => !isNaN(d));
  console.log("SMI valid points:", smiData.length);
  if(smiData.length > 0) {
    console.log("First SMI:", smiData[0], "Last SMI:", smiData[smiData.length-1]);
  }
} catch(e) {
  console.error(e);
}

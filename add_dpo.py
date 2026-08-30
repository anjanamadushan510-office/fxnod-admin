import sys

with open('src/lib/indicators.ts', 'r') as f:
    content = f.read()

dpo_func = """
export function calculateDPO(data: number[], period: number = 14, maType: string = "Simple"): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;
  
  const ma = calculateMA(data, period, maType);
  const shift = Math.floor(period / 2) + 1;
  
  for (let i = shift; i < data.length; i++) {
    const pastMA = ma[i - shift];
    if (!isNaN(pastMA)) {
      result[i] = data[i] - pastMA;
    }
  }
  
  return result;
}
"""

if 'calculateDPO' not in content:
    with open('src/lib/indicators.ts', 'a') as f:
        f.write('\n' + dpo_func)
    print('Added calculateDPO')
else:
    print('Already exists')

import sys

with open('src/components/options/chart/LiveChart.tsx', 'r') as f:
    content = f.read()

if 'calculateDPO' not in content:
    content = content.replace(
        'calculateDonchianChannel, calculateAlligator, calculateFractalChaosBands',
        'calculateDonchianChannel, calculateAlligator, calculateFractalChaosBands, calculateDPO'
    )

if 'ind.type === "dpo"' not in content:
    # Add to activeScales
    content = content.replace(
        'else if (ind.type === "roc" || ind.type === "wpr" || ind.type === "cci") activeScales.add(`${ind.type}-scale`);',
        'else if (ind.type === "roc" || ind.type === "wpr" || ind.type === "cci") activeScales.add(`${ind.type}-scale`);\n        else if (ind.type === "dpo") activeScales.add("dpo-scale");'
    )
    
    # Add logic
    dpo_logic = """
    } else if (ind.type === 'dpo') {
      let series = seriesRef.current.get(ind.id) as ISeriesApi<'Line'>;
      if (!series) {
        series = chart.addSeries(LineSeries, { 
          color: ind.params.color || '#000000', 
          lineWidth: 1, 
          priceScaleId: 'dpo-scale',
          priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
        });
        seriesRef.current.set(ind.id, series);
      } else {
        series.applyOptions({ color: ind.params.color || '#000000' });
      }
      
      const p = ind.params.period || 14;
      const field = ind.params.field || 'Close';
      const maType = ind.params.movingAverageType || 'Simple';
      
      let targetArray = valueArray;
      if (field === 'High') targetArray = highArray;
      else if (field === 'Low') targetArray = lowArray;
      else if (field === 'Open') targetArray = chartData.map(d => d.open);
      else if (field === '(H+L)/2') targetArray = highArray.map((h, i) => (h + lowArray[i]) / 2);
      else if (field === '(H+L+C)/3') targetArray = highArray.map((h, i) => (h + lowArray[i] + valueArray[i]) / 3);
      else if (field === '(H+L+C+C)/4') targetArray = highArray.map((h, i) => (h + lowArray[i] + valueArray[i] * 2) / 4);
      else if (field === '(O+H+L+C)/4') targetArray = chartData.map((d, i) => (d.open + highArray[i] + lowArray[i] + valueArray[i]) / 4);

      const results = calculateDPO(targetArray, p, maType);
      const data = results.map((val, i) => ({ time: timeArray[i], value: val })).filter(d => !isNaN(d.value));
      if (data.length > 0) series.setData(data as any);
"""
    content = content.replace(
        "} else if (ind.type === 'fractal') {",
        dpo_logic + "\n      } else if (ind.type === 'fractal') {"
    )
    
    with open('src/components/options/chart/LiveChart.tsx', 'w') as f:
        f.write(content)
    print("DPO added to LiveChart")
else:
    print("DPO already in LiveChart")

import re

with open('E:\\ajantha\\fxnod-frontend\\src\\components\\options\\chart\\LiveChart.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    } else if (ind.type === 'smi') {
        let smiLine = seriesRef.current.get(`${ind.id}-smi`) as ISeriesApi<'Line'>;
        let smiObFill = seriesRef.current.get(`${ind.id}-smi-ob`) as ISeriesApi<'Baseline'>;
        let smiOsFill = seriesRef.current.get(`${ind.id}-smi-os`) as ISeriesApi<'Baseline'>;
        let signalLine = seriesRef.current.get(`${ind.id}-signal`) as ISeriesApi<'Line'>;
        
        const obVal = ind.params.overBoughtValue ?? 40;
        const osVal = ind.params.overSoldValue ?? -40;
        const showZones = ind.params.showZones !== false;
        
        if (!smiLine) {
          smiObFill = chart.addSeries(BaselineSeries, { 
            baseValue: { type: 'price', price: obVal },
            topLineColor: 'transparent',
            bottomLineColor: 'transparent',
            topFillColor1: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
            topFillColor2: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
            bottomFillColor1: 'transparent',
            bottomFillColor2: 'transparent',
            lineWidth: 1, 
            priceScaleId: `${ind.id}-scale`,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });

          smiOsFill = chart.addSeries(BaselineSeries, { 
            baseValue: { type: 'price', price: osVal },
            topLineColor: 'transparent',
            bottomLineColor: 'transparent',
            topFillColor1: 'transparent',
            topFillColor2: 'transparent',
            bottomFillColor1: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
            bottomFillColor2: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
            lineWidth: 1, 
            priceScaleId: `${ind.id}-scale`,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });

          smiLine = chart.addSeries(LineSeries, { 
            color: ind.params.color || '#000000', 
            lineWidth: 1, 
            priceScaleId: `${ind.id}-scale`,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            priceLineVisible: false
          });
          
          signalLine = chart.addSeries(LineSeries, { 
            color: ind.params.signalColor || '#ff0000', 
            lineWidth: 1, 
            priceScaleId: `${ind.id}-scale`,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            priceLineVisible: false
          });
  
          // Add 0 line
          smiLine.createPriceLine({ price: 0, color: 'rgba(0,0,0,0.2)', lineWidth: 1, lineStyle: 0, axisLabelVisible: false });
          
          seriesRef.current.set(`${ind.id}-smi-ob`, smiObFill);
          seriesRef.current.set(`${ind.id}-smi-os`, smiOsFill);
          seriesRef.current.set(`${ind.id}-smi`, smiLine);
          seriesRef.current.set(`${ind.id}-signal`, signalLine);
        } else {
          smiLine.applyOptions({ color: ind.params.color || '#000000' });
          signalLine.applyOptions({ color: ind.params.signalColor || '#ff0000' });
          smiObFill.applyOptions({
            baseValue: { type: 'price', price: obVal },
            topFillColor1: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
            topFillColor2: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
          });
          smiOsFill.applyOptions({
            baseValue: { type: 'price', price: osVal },
            bottomFillColor1: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
            bottomFillColor2: showZones ? 'rgba(128, 128, 128, 0.3)' : 'transparent',
          });
        }
        
        // Update Price Lines (Overbought / Oversold)
        if (showZones) {
          const obCol = ind.params.overBoughtColor || '#808080';
          const osCol = ind.params.overSoldColor || '#808080';
          
          let obPriceLine = seriesRef.current.get(`${ind.id}-ob-line`) as any;
          let osPriceLine = seriesRef.current.get(`${ind.id}-os-line`) as any;
          
          if (!obPriceLine) {
            obPriceLine = smiLine.createPriceLine({ price: obVal, color: obCol, lineWidth: 1, lineStyle: 0, axisLabelVisible: false });
            osPriceLine = smiLine.createPriceLine({ price: osVal, color: osCol, lineWidth: 1, lineStyle: 0, axisLabelVisible: false });
            seriesRef.current.set(`${ind.id}-ob-line`, obPriceLine);
            seriesRef.current.set(`${ind.id}-os-line`, osPriceLine);
          } else {
            obPriceLine.applyOptions({ price: obVal, color: obCol });
            osPriceLine.applyOptions({ price: osVal, color: osCol });
          }
        } else {
          let obPriceLine = seriesRef.current.get(`${ind.id}-ob-line`) as any;
          let osPriceLine = seriesRef.current.get(`${ind.id}-os-line`) as any;
          if (obPriceLine) { smiLine.removePriceLine(obPriceLine); seriesRef.current.delete(`${ind.id}-ob-line`); }
          if (osPriceLine) { smiLine.removePriceLine(osPriceLine); seriesRef.current.delete(`${ind.id}-os-line`); }
        }

        const q = ind.params.period || 10;
        const r = ind.params.smoothingPeriod1 || 3;
        const s = ind.params.smoothingPeriod2 || 3;
        const sig = ind.params.signalPeriod || 10;
        const maType = ind.params.movingAverageType || 'Exponential';
  
        const results = calculateSMI(highArray, lowArray, valueArray, q, r, s, sig, maType);
        
        const smiData = results.smi.map((val, i) => ({ time: timeArray[i], value: val })).filter(d => !isNaN(d.value) && isFinite(d.value));
        const sigData = results.signal.map((val, i) => ({ time: timeArray[i], value: val })).filter(d => !isNaN(d.value) && isFinite(d.value));

        if (smiData.length > 0) {
          smiLine.setData(smiData as any);
          smiObFill.setData(smiData as any);
          smiOsFill.setData(smiData as any);
        }
        if (sigData.length > 0) signalLine.setData(sigData as any);
'''

start_str = "    } else if (ind.type === 'smi') {"
end_str = "    } else if (ind.type === 'dpo') {"
start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + '\n' + content[end_idx:]
    with open('E:\\ajantha\\fxnod-frontend\\src\\components\\options\\chart\\LiveChart.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Patched successfully!')
else:
    print('Indices not found:', start_idx, end_idx)

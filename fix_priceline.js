const fs = require('fs');
const path = require('path');
const file = 'E:/ajantha/fxnod-frontend/src/components/options/chart/LiveChart.tsx';
let content = fs.readFileSync(file, 'utf8');

// We want to add priceLineVisible: false to every options object in chart.addSeries(..., { ... })
// But only inside the syncIndicators function.
// An easier way: just match chart.addSeries(SomeSeries, { and if it doesn't contain priceLineVisible before the closing }), add it.

content = content.replace(/chart\.addSeries\([a-zA-Z]+,\s*\{([\s\S]*?)\}\);/g, (match, p1) => {
    if (p1.includes('priceLineVisible')) {
        return match; // Already has it
    }
    // Add priceLineVisible: false
    return match.replace(/\{/, '{ priceLineVisible: false,');
});

fs.writeFileSync(file, content);
console.log('Done');

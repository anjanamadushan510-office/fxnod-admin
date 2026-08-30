const fs = require('fs');
const file = 'E:/ajantha/fxnod-frontend/src/components/options/chart/LiveChart.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('IchimokuCloudPlugin')) {
    content = content.replace(/import \{.*?\} from "@\/lib\/indicators";/s, (match) => {
        return match + '\nimport { IchimokuCloudPlugin } from "@/components/options/chart/plugins/IchimokuCloudPlugin";';
    });
}

// In syncIndicators, find ichimoku
// Update the plugin initialization and attach
// We need to store it in pluginsRef?
// pluginsRef in syncIndicators is pluginsRef: React.MutableRefObject<Map<string, ISeriesMarkersPluginApi<Time>>>
// Wait, the plugin is an ISeriesPrimitive, not a markers plugin.
// So we can use a new ref, or just reuse the pluginsRef (but the type might be wrong).
// Actually, pluginsRef in LiveChart is indicatorPluginsRef = useRef(new Map()); which is Map<string, any>.

const ichimokuBlockStart = content.indexOf('} else if (ind.type === "ichimoku") {');
if (ichimokuBlockStart !== -1) {
    // Find the end of ichimoku block
    const nextBlock = content.indexOf('} else if (ind.type === "parabolic_sar") {');
    let ichimokuBlock = content.substring(ichimokuBlockStart, nextBlock);
    
    if (!ichimokuBlock.includes('IchimokuCloudPlugin')) {
        // Find where senkouBData is declared and populated
        // Add plugin update there
        const senkouBDataIdx = ichimokuBlock.indexOf('const senkouBData =');
        // Find where it ends
        const endOfSenkouBData = ichimokuBlock.indexOf('}).filter((d)', senkouBDataIdx);
        const nextSemi = ichimokuBlock.indexOf(';', endOfSenkouBData);
        
        const insertPos = nextSemi + 1;
        
        const before = ichimokuBlock.substring(0, insertPos);
        const after = ichimokuBlock.substring(insertPos);
        
        const pluginCode = 
      let cloud = pluginsRef.current.get(\\-cloud\) as any;
      if (!cloud) {
          cloud = new IchimokuCloudPlugin(senkouAData as any, senkouBData as any, "rgba(0, 255, 0, 0.2)", "rgba(255, 0, 0, 0.2)");
          senkouA.attachPrimitive(cloud);
          pluginsRef.current.set(\\-cloud\, cloud);
      } else {
          cloud.updateData(senkouAData as any, senkouBData as any);
      }
;
        
        const newIchimokuBlock = before + pluginCode + after;
        content = content.replace(ichimokuBlock, newIchimokuBlock);
    }
}

fs.writeFileSync(file, content);
console.log('Done');

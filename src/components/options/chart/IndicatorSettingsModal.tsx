import { useState, useEffect } from "react";
import { X, Save, ChevronDown, Trash2 } from "lucide-react";
import { useChartIndicators, DEFAULT_INDICATOR_PARAMS } from "@/stores/useChartIndicators";
import { INDICATOR_LIST } from "./IndicatorsModal";

const PALETTE_COLORS = [
  "#ffffff", "#e1e1e1", "#cccccc", "#b7b7b7", "#a0a0a5", "#898989", "#707070", "#626262", "#555555", "#464646", "#363636", "#262626", "#1d1d1d", "#000000",
  "#f4977c", "#f7ac84", "#fbc58d", "#fff69e", "#c4de9e", "#85c99e", "#7fcdc7", "#75d0f4", "#81a8d7", "#8594c8", "#8983bc", "#a187bd", "#bb8dbe", "#f29bc1",
  "#ef6c53", "#f38d5b", "#f8ae63", "#fff371", "#acd277", "#43b77a", "#2ebbb3", "#00bff0", "#4a8dc8", "#5875b7", "#625da6", "#8561a7", "#a665a7", "#ee6fa9",
  "#ea1d2c", "#ee652e", "#f4932f", "#fff126", "#8ec648", "#00a553", "#00a99c", "#00afed", "#0073ba", "#0056a4", "#323390", "#66308f", "#912a8e", "#e9088c",
  "#9b0b16", "#9e4117", "#a16118", "#c6b920", "#5a852d", "#007238", "#00746a", "#0077a1", "#004c7f", "#003570", "#1d1762", "#441261", "#62095f", "#9c005d",
  "#770001", "#792e03", "#7b4906", "#817a0b", "#41661e", "#005827", "#005951", "#003b5c", "#001d40", "#000e35", "#04002c", "#19002b", "#2c002a", "#580028"
];

function CustomColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded border border-opt-line bg-transparent px-2 py-1.5 focus:border-opt-ink"
      >
        <div className="h-5 w-full max-w-[220px] rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" style={{ backgroundColor: value }} />
        <ChevronDown className={`h-4 w-4 text-opt-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-max rounded-xl border border-opt-line bg-opt-bg-elev p-3 shadow-2xl">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
              {PALETTE_COLORS.map((c, i) => (
                <button
                  key={`${c}-${i}`}
                  onClick={() => {
                    onChange(c);
                    setIsOpen(false);
                  }}
                  className={`h-5 w-5 rounded-sm transition-transform hover:scale-110 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] ${value === c ? 'ring-2 ring-opt-ink ring-offset-1 ring-offset-opt-bg-elev' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function IndicatorSettingsModal({ indicatorId, onClose }: { indicatorId: string; onClose: () => void }) {
  const { indicators, updateIndicator, removeIndicator } = useChartIndicators();
  const indicator = indicators.find((ind) => ind.id === indicatorId);
  
  // Use state to hold local edits before saving
  const [params, setParams] = useState<Record<string, any>>({});

  useEffect(() => {
    if (indicator) {
      // Merge with defaults in case the indicator was saved before new parameters were added
      const defaultParams = DEFAULT_INDICATOR_PARAMS[indicator.type] || {};
      setParams({ ...defaultParams, ...indicator.params });
    }
  }, [indicator]);

  if (!indicator) return null;

  const handleSave = () => {
    updateIndicator(indicatorId, params);
    onClose();
  };

  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const formatLabel = (key: string) => {
    if (key.includes('Shift')) key = key.replace('Shift', 'Offset');
    if (key === 'showLines') return 'Show Lines';
    if (key === 'showFractals') return 'Show Fractals';
    if (key === "macdColor" || key === "rocColor" || key === "maColor") return "Color";
    if (key === "adxColor") return "Color";
    if (key === "cciColor") return "Color";
    if (key === "plusDiColor") return "+DI";
    if (key === "minusDiColor") return "-DI";
    if (key === "positiveBarColor") return "Positive Bar";
    if (key === "negativeBarColor") return "Negative Bar";
    if (key === "showSeries") return "Series";
    if (key === "showShading") return "Shading";
    if (key === "showHistogram") return "Histogram";
    if (key === "signalColor") return "Signal";
    if (key === "increasingBarColor") return "Increasing Bar";
    if (key === "decreasingBarColor") return "Decreasing Bar";
    if (key === "fastPeriod") return "Fast MA Period";
    if (key === "slowPeriod") return "Slow MA Period";
    if (key === "signalPeriod") return "Signal Period";
    if (key === "smoothingPeriod") return "Smoothing Period";
    if (key === "conversionLineColor") return "Conversion Line";
    if (key === "baseLineColor") return "Base Line";
    if (key === "leadingSpanAColor") return "Leading Span A";
    if (key === "leadingSpanBColor") return "Leading Span B";
    if (key === "laggingSpanColor") return "Lagging Span";
    if (key === "conversionLinePeriod") return "Conversion Line Period";
    if (key === "baseLinePeriod") return "Base Line Period";
    if (key === "leadingSpanBPeriod") return "Leading Span B Period";
    if (key === "laggingSpanPeriod") return "Lagging Span Period";
    if (key === "sarColor") return "Color";
    if (key === "zigZagColor") return "Color";
    if (key === "minimumAF") return "Minimum AF";
    if (key === "maximumAF") return "Maximum AF";
    if (key === "distance") return "Distance(%)";
    if (key === "upperColor") return indicator.type === 'donchian' ? "Donchian High" : "Bollinger Bands Top";
    if (key === "middleColor") return indicator.type === 'donchian' ? "Donchian Median" : "Bollinger Bands Median";
    if (key === "lowerColor") return indicator.type === 'donchian' ? "Donchian Low" : "Bollinger Bands Bottom";
    if (key === "fillColor") return "Fill Color";
    if (key === "standardDeviations") return "Standard Deviations";
        if (key === "smoothingPeriod1") return "Smoothing Period";
    if (key === "smoothingPeriod2") return "Double Smoothing Period";
    if (key === "movingAverageType") return indicator.type === 'smi' ? 'Field' : (indicator.type === 'ma' || indicator.type === 'ma_envelope' || indicator.type === 'rainbow_ma') ? "Type" : "Moving Average Type";
    if (key === "channelFill") return "Channel Fill";
    if (key === "highPeriod") return "High Period";
    if (key === "lowPeriod") return "Low Period";


    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const renderParam = (key: string, value: any) => {
    if (typeof value === "boolean") {
      return (
        <div key={key} className="flex items-center justify-between rounded-lg border border-opt-line p-3">
          <label className="text-[13px] font-medium text-opt-ink-2">{formatLabel(key)}</label>
          <button
            onClick={() => handleParamChange(key, !value)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-[#26a69a]' : 'bg-opt-line'}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      );
    }
    if (key === "maType") {
      return (
        <div key={key} className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-opt-ink-2">{formatLabel(key)}</label>
          <select
            value={value}
            onChange={(e) => handleParamChange(key, e.target.value)}
            className="rounded border border-opt-line bg-opt-bg-sunk px-2 py-1 text-[13px] text-opt-ink outline-none focus:border-opt-ink"
          >
            <option value="SMA">Simple</option>
            <option value="EMA">Exponential</option>
            <option value="WMA">Weighted</option>
          </select>
        </div>
      );
    }
    if (key === "shiftType") {
      return (
        <div key={key} className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-opt-ink-2">{formatLabel(key)}</label>
          <select
            value={value}
            onChange={(e) => handleParamChange(key, e.target.value)}
            className="rounded border border-opt-line bg-opt-bg-sunk px-2 py-1 text-[13px] text-opt-ink outline-none focus:border-opt-ink"
          >
            <option value="percent">Percentage</option>
            <option value="points">Points</option>
          </select>
        </div>
      );
    }
    if (key === "field") {
      return (
        <div key={key} className="flex flex-col gap-2 rounded-lg border border-opt-line p-3">
          <label className="text-[11px] font-medium text-opt-ink-3">{formatLabel(key)}</label>
          <select
            value={value}
            onChange={(e) => handleParamChange(key, e.target.value)}
            className="w-full rounded bg-transparent px-2 py-1 text-[13px] text-opt-ink outline-none"
          >
            <option value="Close">Close</option>
            <option value="Open">Open</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
            <option value="Hl/2">Hl/2</option>
            <option value="Hlc/3">Hlc/3</option>
          </select>
        </div>
      );
    }
    if (key === "movingAverageType") {
      return (
        <div key={key} className="flex flex-col gap-2 rounded-lg border border-opt-line p-3">
          <label className="text-[11px] font-medium text-opt-ink-3">{formatLabel(key)}</label>
          <select
            value={value}
            onChange={(e) => handleParamChange(key, e.target.value)}
            className="w-full rounded bg-transparent px-2 py-1 text-[13px] text-opt-ink outline-none"
          >
            <option value="Simple">Simple</option>
            <option value="Exponential">Exponential</option>
            <option value="Weighted">Weighted</option>
            <option value="Hull">Hull</option>
            <option value="Zero Lag">Zero Lag</option>
            <option value="Time Series">Time Series</option>
          </select>
        </div>
      );
    }
    if (key.toLowerCase().includes("color")) {
      return (
        <div key={key} className="flex h-full flex-col justify-center gap-1.5 rounded-lg border border-opt-line p-3">
          <label className="text-[11px] font-medium text-opt-ink-3">
            {formatLabel(key).replace(" Color", "")}
          </label>
          <CustomColorPicker value={value} onChange={(v) => handleParamChange(key, v)} />
        </div>
      );
    }
    if (typeof value === 'number') {
      if (key.includes("Value")) {
        return (
          <div key={key} className="flex h-full overflow-hidden rounded-lg border border-opt-line">
            <div className="flex flex-1 flex-col justify-center px-3 py-1.5">
              <label className="text-[10px] font-medium text-opt-ink-3">Size</label>
              <input
                type="number"
                value={value}
                onChange={(e) => handleParamChange(key, parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent p-0 text-[13px] font-semibold text-opt-ink outline-none"
              />
            </div>
            <div className="flex w-7 flex-col border-l border-opt-line bg-opt-bg-elev">
              <button
                onClick={() => handleParamChange(key, value + 1)}
                className="flex flex-1 items-center justify-center border-b border-opt-line text-[12px] text-opt-ink-3 hover:bg-opt-bg-sunk hover:text-opt-ink"
              >
                +
              </button>
              <button
                onClick={() => handleParamChange(key, value - 1)}
                className="flex flex-1 items-center justify-center text-[12px] text-opt-ink-3 hover:bg-opt-bg-sunk hover:text-opt-ink"
              >
                -
              </button>
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="flex h-full flex-col justify-center gap-2 rounded-lg border border-opt-line p-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-opt-ink-3">
              {formatLabel(key)}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleParamChange(key, parseFloat(e.target.value) || 0)}
              className="w-16 rounded bg-transparent p-0 text-right text-[13px] font-semibold text-opt-ink outline-none"
            />
          </div>
          <input
            type="range"
            min={key === 'stdDev' ? '0.1' : '1'}
            max={key === 'stdDev' ? '10' : key.toLowerCase().includes('shift') ? '50' : '200'}
            step={key === 'stdDev' ? '0.1' : '1'}
            value={value}
            onChange={(e) => handleParamChange(key, parseFloat(e.target.value) || 0)}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-opt-line accent-[#ef5350]"
          />
        </div>
      );
    }
    
    return (
      <div key={key} className="flex h-full flex-col justify-center gap-2 rounded-lg border border-opt-line p-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-opt-ink-3">
            {formatLabel(key)}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleParamChange(key, e.target.value)}
            className="w-full rounded border border-opt-line bg-transparent px-2 py-1 text-[13px] font-semibold text-opt-ink outline-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-[420px] flex-col overflow-hidden rounded-md border border-opt-line bg-opt-bg-elev shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-opt-line bg-opt-bg-elev px-4 py-3 z-10">
          <h2 className="text-[14px] font-semibold text-opt-ink">{INDICATOR_LIST.find(i => i.id === indicator.type)?.name || indicator.type.toUpperCase()}</h2>
          <button onClick={onClose} className="text-opt-ink-3 transition-colors hover:text-opt-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scrollbar flex flex-1 min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4">
                    {indicator.type === 'smi' ? (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">%K</h3>
                <div className="flex flex-col gap-4">
                  {renderParam("color", params.color)}
                  {renderParam("period", params.period)}
                  {renderParam("smoothingPeriod1", params.smoothingPeriod1)}
                  {renderParam("smoothingPeriod2", params.smoothingPeriod2)}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">%D</h3>
                <div className="flex flex-col gap-4">
                  {renderParam("signalColor", params.signalColor)}
                  {renderParam("signalPeriod", params.signalPeriod)}
                  {renderParam("movingAverageType", params.movingAverageType)}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">Over Bought</h3>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1">
                    {renderParam("overBoughtValue", params.overBoughtValue)}
                  </div>
                  <div className="w-[120px] shrink-0">
                    {renderParam("overBoughtColor", params.overBoughtColor)}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">OverSold</h3>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1">
                    {renderParam("overSoldValue", params.overSoldValue)}
                  </div>
                  <div className="w-[120px] shrink-0">
                    {renderParam("overSoldColor", params.overSoldColor)}
                  </div>
                </div>
              </div>
              <div>
                {renderParam("showZones", params.showZones)}
              </div>
            </div>
          ) : params.overBoughtValue !== undefined ? (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">Result</h3>
                <div className="flex flex-col gap-4">
                  {Object.keys(DEFAULT_INDICATOR_PARAMS[indicator.type] || {})
                    .filter(key => {
                      if (indicator.type === 'alligator' && params.showLines === false) {
                        if (['jawColor', 'teethColor', 'lipsColor'].includes(key)) return false;
                      }
                      return !['overBoughtValue', 'overBoughtColor', 'overSoldValue', 'overSoldColor', 'showZones'].includes(key);
                    })
                    .map((key) => renderParam(key, params[key]))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">Over Bought</h3>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1">
                    {params.overBoughtValue !== undefined && renderParam("overBoughtValue", params.overBoughtValue)}
                  </div>
                  <div className="w-[120px] shrink-0">
                    {params.overBoughtColor !== undefined && renderParam("overBoughtColor", params.overBoughtColor)}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[12px] font-bold text-opt-ink">OverSold</h3>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1">
                    {params.overSoldValue !== undefined && renderParam("overSoldValue", params.overSoldValue)}
                  </div>
                  <div className="w-[120px] shrink-0">
                    {params.overSoldColor !== undefined && renderParam("overSoldColor", params.overSoldColor)}
                  </div>
                </div>
              </div>
              <div>
                {params.showZones !== undefined && renderParam("showZones", params.showZones)}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="mb-3 text-[12px] font-bold text-opt-ink">Result</h3>
              <div className="flex flex-col gap-4">
                {Object.keys(DEFAULT_INDICATOR_PARAMS[indicator.type] || {})
                  .map((key) => renderParam(key, params[key]))}
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-opt-line p-4">
          <button
            onClick={() => {
              removeIndicator(indicatorId);
              onClose();
            }}
            className="flex items-center justify-center rounded border border-opt-line p-2 text-opt-ink-3 transition-colors hover:bg-opt-bg-sunk hover:text-opt-ink"
            title="Delete Indicator"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const defaultParams = DEFAULT_INDICATOR_PARAMS[indicator.type] || {};
                setParams({ ...defaultParams });
              }}
              className="rounded border border-opt-line px-4 py-2 text-[13px] font-semibold text-opt-ink transition-colors hover:bg-opt-bg-sunk"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded bg-[#ef5350] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#d32f2f]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IndicatorType = "ma" | "ma_envelope" | "rainbow_ma" | "MACD" | "RSI" | "awesome_oscillator" | "roc" | "stochastic" | "wpr" | "cci" | "aroon" | "adx" | "ichimoku" | "parabolic_sar" | "zigzag" | "bollinger" | "donchian" | "alligator" | "fractal" | "dpo" | "smi" | "supertrend";

export interface IndicatorConfig {
  id: string; // Unique instance ID
  type: IndicatorType;
  symbol: string; // The market symbol this indicator is attached to
  params: Record<string, any>; // e.g. { period: 14 }
}

export const DEFAULT_INDICATOR_PARAMS: Record<IndicatorType, Record<string, any>> = {
  ma: { maColor: "#ff0000", period: 50, field: "Close", movingAverageType: "Simple", offset: 0 },
  ma_envelope: { topColor: "#000000", medianColor: "#000000", bottomColor: "#000000", fillColor: "#000000", channelFill: true, period: 50, movingAverageType: "Simple", shift: 5, shiftType: "percent" },
  rainbow_ma: { field: "Close", period: 2, movingAverageType: "Simple", sma1Color: '#ff3b3b', sma2Color: '#ff9800', sma3Color: '#ffeb3b', sma4Color: '#8bc34a', sma5Color: '#4caf50', sma6Color: '#00bcd4', sma7Color: '#2196f3', sma8Color: '#3f51b5', sma9Color: '#9c27b0', sma10Color: '#e91e63' },
  MACD: { macdColor: "#000000", signalColor: "#f44336", increasingBarColor: "#4caf50", decreasingBarColor: "#f44336", fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  RSI: { rsiColor: "#000000", period: 14, field: "Close", overBoughtValue: 80, overBoughtColor: "#000000", overSoldValue: 20, overSoldColor: "#000000", showZones: true },
  awesome_oscillator: { increasingBarColor: "#26a69a", decreasingBarColor: "#ef5350" },
  roc: { rocColor: "#000000", period: 14, field: "Close" },
  stochastic: { fastColor: "#000000", slowColor: "#ff0000", period: 14, field: "Close", smooth: true, overBoughtValue: 80, overBoughtColor: "#000000", overSoldValue: 20, overSoldColor: "#000000", showZones: true },
  wpr: { wprColor: "#000000", period: 14, overBoughtValue: -20, overBoughtColor: "#000000", overSoldValue: -80, overSoldColor: "#000000", showZones: true },
  cci: { cciColor: "#000000", period: 20, overBoughtValue: 100, overBoughtColor: "#000000", overSoldValue: -100, overSoldColor: "#000000", showZones: true },
  aroon: { aroonUpColor: "#00ff00", aroonDownColor: "#ff0000", period: 14 },
  adx: { plusDiColor: "#00ff00", minusDiColor: "#ff0000", adxColor: "#000000", positiveBarColor: "#00ff00", negativeBarColor: "#ff0000", period: 14, smoothingPeriod: 14, showSeries: true, showShading: false, showHistogram: false },
  ichimoku: { conversionLineColor: "#2962FF", baseLineColor: "#ef5350", leadingSpanAColor: "#4caf50", leadingSpanBColor: "#ef5350", laggingSpanColor: "#00e676", conversionLinePeriod: 9, baseLinePeriod: 26, leadingSpanBPeriod: 52, laggingSpanPeriod: -26 },
  parabolic_sar: { sarColor: "#000000", minimumAF: 0.02, maximumAF: 0.2 },
  zigzag: { zigZagColor: "#000000", distance: 10 },
  bollinger: { upperColor: "#000000", middleColor: "#000000", lowerColor: "#000000", fillColor: "rgba(0, 0, 0, 0.1)", period: 20, field: "Close", standardDeviations: 2, movingAverageType: "Simple", channelFill: true },
  donchian: { upperColor: "#000000", middleColor: "#000000", lowerColor: "#000000", fillColor: "rgba(0, 0, 0, 0.1)", highPeriod: 20, lowPeriod: 20, channelFill: true },
  alligator: { jawColor: '#2962FF', teethColor: '#FF0000', lipsColor: '#00FF00', showLines: true, jawPeriod: 13, jawShift: 8, teethPeriod: 8, teethShift: 5, lipsPeriod: 5, lipsShift: 3, showFractals: false },
  fractal: { fractalHighColor: "#000000", fractalLowColor: "#000000", fractalChannelColor: "#000000", channelFill: true },
  dpo: { color: "#000000", period: 21, field: "Close", movingAverageType: "Simple" },
  smi: { color: "#000000", signalColor: "#ff0000", period: 10, smoothingPeriod1: 3, smoothingPeriod2: 3, signalPeriod: 10, movingAverageType: "Exponential", overBoughtValue: 40, overBoughtColor: "#808080", overSoldValue: -40, overSoldColor: "#808080", showZones: true },
  supertrend: { upColor: "#00FF00", downColor: "#FF0000", period: 10, multiplier: 3 },
};

interface ChartIndicatorsState {
  indicators: IndicatorConfig[];
  addIndicator: (symbol: string, type: IndicatorType, params?: Record<string, any>) => void;
  removeIndicator: (id: string) => void;
  updateIndicator: (id: string, params: Record<string, any>) => void;
  clearIndicators: (symbol: string) => void;
}

export const useChartIndicators = create<ChartIndicatorsState>()(
  persist(
    (set) => ({
      indicators: [],

      addIndicator: (symbol, type, params) =>
        set((state) => {
          const activeCount = state.indicators.filter(i => i.symbol === symbol).length;
          if (activeCount >= 5) return state;

          const newIndicator: IndicatorConfig = {
            id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type,
            symbol,
            params: params || { ...DEFAULT_INDICATOR_PARAMS[type] },
          };
          return { indicators: [...state.indicators, newIndicator] };
        }),

      removeIndicator: (id) =>
        set((state) => ({
          indicators: state.indicators.filter((ind) => ind.id !== id),
        })),

      updateIndicator: (id, params) =>
        set((state) => ({
          indicators: state.indicators.map((ind) =>
            ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind
          ),
        })),

      clearIndicators: (symbol) =>
        set((state) => ({
          indicators: state.indicators.filter((ind) => ind.symbol !== symbol),
        })),
    }),
    {
      name: "chart-indicators-storage", // unique name in localStorage
    }
  )
);

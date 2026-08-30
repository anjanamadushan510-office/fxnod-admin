import { create } from "zustand";

interface AccumulatorPreviewState {
  growthRate: number | null;
  barrierPct: number | null;
  stats: number[] | null;
  setGrowthRate: (rate: number | null) => void;
  setBarrierPct: (pct: number | null) => void;
  setStats: (stats: number[] | null) => void;
}

export const useAccumulatorPreview = create<AccumulatorPreviewState>((set) => ({
  growthRate: null,
  barrierPct: null,
  stats: null,
  setGrowthRate: (rate) => set({ growthRate: rate }),
  setBarrierPct: (pct) => set({ barrierPct: pct }),
  setStats: (newStats) => set((state) => {
    if (!newStats || newStats.length === 0) return { stats: state.stats };
    
    // If the API sends multiple stats (history included), assume it's newest-first.
    if (newStats.length > 1) {
      return { stats: newStats };
    }
    
    // If the API only sends 1 stat (current run), accumulate it locally
    const activeStat = newStats[0];
    const prevStats = state.stats || [];
    
    if (prevStats.length === 0) {
      return { stats: [activeStat] };
    }
    
    const prevActive = prevStats[0];
    
    // If the active stat drops, it means a new run started
    if (activeStat < prevActive) {
      // Prepend the new active stat (index 0 is newest)
      const newHistory = [activeStat, ...prevStats];
      if (newHistory.length > 100) {
        return { stats: newHistory.slice(0, 100) };
      }
      return { stats: newHistory };
    } else {
      // Same run, just update the active stat at index 0
      const updatedStats = [...prevStats];
      updatedStats[0] = activeStat;
      return { stats: updatedStats };
    }
  }),
}));

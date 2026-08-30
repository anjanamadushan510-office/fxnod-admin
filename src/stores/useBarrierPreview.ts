import { create } from "zustand";

interface BarrierPreviewState {
  barrier: number | null;
  setBarrier: (barrier: number | null) => void;
}

export const useBarrierPreview = create<BarrierPreviewState>((set) => ({
  barrier: null,
  setBarrier: (barrier) => set({ barrier }),
}));

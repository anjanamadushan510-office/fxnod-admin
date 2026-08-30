import { create } from "zustand";

interface AccountBalanceState {
  balance: number;
  currency: string;
  setBalance: (balance: number, currency?: string) => void;
}

export const useAccountBalance = create<AccountBalanceState>((set) => ({
  balance: 0,
  currency: "USD",
  setBalance: (balance, currency) =>
    set((state) => ({
      balance,
      currency: currency ?? state.currency,
    })),
}));

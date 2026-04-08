import { create } from "zustand";
import { Wallet } from "@/types/wallet";

type WalletStore = {
  highlightBalance: boolean;
  setHighlightBalance: (value: boolean) => void;
};

export const useWalletStore = create<WalletStore>((set) => ({
  highlightBalance: false,
  setHighlightBalance: (value) => set({ highlightBalance: value }),
}));

// frontend/src/stores/gameStore.ts

import { create } from "zustand";
import { GameState, Round, Bet, User, RoundHistory } from "@/types/games";

interface GameActions {
  // Ações
  placeBet: (amount: number) => Promise<void>;
  cashOut: () => Promise<void>;
  setCurrentRound: (round: Round) => void;
  updateMultiplier: (multiplier: number) => void;
  addBet: (bet: Bet) => void;
  updateBet: (betId: string, updates: Partial<Bet>) => void;
  clearBets: () => void;
  setUser: (user: User) => void;
  updateBalance: (newBalance: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Dados mockados para desenvolvimento
const mockUser: User = {
  id: "1",
  username: "PlayerTest",
  balance: 5000.0,
};

const initialState: GameState = {
  currentRound: null,
  myBet: null,
  currentBets: [],
  roundHistory: [],
  user: mockUser,
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  updateBalance: (newBalance) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, balance: newBalance }
        : { id: "1", username: "PlayerTest", balance: newBalance },
    })),

  setCurrentRound: (round) => set({ currentRound: round }),

  updateMultiplier: (multiplier) =>
    set((state) => ({
      currentRound: state.currentRound
        ? { ...state.currentRound, multiplier }
        : null,
    })),

  addBet: (bet) =>
    set((state) => ({
      currentBets: [...state.currentBets, bet],
      ...(bet.userId === state.user?.id && { myBet: bet }),
    })),

  updateBet: (betId, updates) =>
    set((state) => ({
      currentBets: state.currentBets.map((bet) =>
        bet.id === betId ? { ...bet, ...updates } : bet,
      ),
      myBet:
        state.myBet?.id === betId
          ? { ...state.myBet, ...updates }
          : state.myBet,
    })),

  clearBets: () => set({ currentBets: [], myBet: null }),

  placeBet: async (amount) => {
    const { user, currentRound } = get();

    if (!user || user.balance < amount) {
      set({ error: "Saldo insuficiente" });
      return;
    }

    if (!currentRound || currentRound.status !== "betting") {
      set({ error: "Não é possível apostar agora" });
      return;
    }

    set({ isLoading: true });

    // Mock - simular delay da API
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newBet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      amount,
      multiplier: null,
      status: "pending",
      cashedOutAt: null,
    };

    get().addBet(newBet);
    get().updateBalance(user.balance - amount);
    set({ isLoading: false });
  },

  cashOut: async () => {
    const { myBet, currentRound, user } = get();

    if (!myBet || myBet.status !== "pending") {
      set({ error: "Nenhuma aposta pendente" });
      return;
    }

    if (!currentRound || currentRound.status !== "running") {
      set({ error: "Não é possível sacar agora" });
      return;
    }

    set({ isLoading: true });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const multiplier = currentRound.multiplier || 1;
    const winAmount = myBet.amount * multiplier;
    const newBalance = (user?.balance || 0) + winAmount;

    get().updateBet(myBet.id, {
      status: "cashed_out",
      multiplier,
      cashedOutAt: new Date(),
    });

    get().updateBalance(newBalance);
    set({ isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

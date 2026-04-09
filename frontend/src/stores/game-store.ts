import { create } from "zustand";
import {
  Bet,
  CurrentRound,
  GameState,
  Round,
  RoundHistory,
  User,
} from "@/types/games";
import { apiFetch } from "@/app/lib/api";

interface GameActions {
  placeBet: (amount: number, accessToken: string) => Promise<void>;
  cashOut: (accessToken: string) => Promise<void>;
  setCurrentRound: (round: CurrentRound) => void;
  replaceRoundHistory: (round: RoundHistory[]) => void;
  updateMultiplier: (multiplier: number) => void;
  addBet: (bet: Bet, userId: string) => void;
  updateBet: (betId: string, updates: Partial<Bet>) => void;
  clearBets: () => void;
  setUser: (user: User | null) => void; // Permite null
  updateBalance: (newBalance: number) => void;
  debitBalance: (amount: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: GameState = {
  currentRound: null,
  myBet: null,
  currentBets: [],
  roundHistory: [],
  user: null,
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,
  replaceRoundHistory: (roundHistory: RoundHistory[]) =>
    set((state) => ({
      ...state,
      roundHistory: roundHistory,
    })),

  setUser: (user) => set({ user }),

  updateBalance: (newBalance) => {
    set((state) => ({
      user: state.user ? { ...state.user, balance: newBalance } : null,
    }));
  },
  setCurrentRound: (round) => set({ currentRound: round }),

  updateMultiplier: (multiplier) =>
    set((state) => ({
      currentRound: state.currentRound
        ? { ...state.currentRound, multiplier }
        : null,
    })),

  addBet: (bet, userId) => {
    set((state) => ({
      currentBets: [...state.currentBets, bet],
      ...(bet.userId === userId && { myBet: bet }),
    }));
  },

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

  placeBet: async (amount, accessToken) => {
    const { user, currentRound } = get();

    if (!user || user.balance < amount) {
      set({ error: "Saldo insuficiente" });
      return;
    }

    if (!currentRound || currentRound.status !== "betting") {
      set({ error: "Não é possível apostar agora" });
      return;
    }

    try {
      const newBet: Bet & { username: string } = {
        id: Math.random().toString(36).substr(2, 9),
        roundId: currentRound.id,
        userId: user.id,
        username: user.username,
        amount,
        multiplier: null,
        status: "pending",
        cashedOutAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // const {} = await apiFetch("games", `/games/bet`, {

      // })

      get().addBet(newBet, user.id);
      get().debitBalance(amount);
      set({ isLoading: true });
    } catch {
      set({ error: "Erro ao fazer aposta" });
    } finally {
      set({ isLoading: false });
    }
  },
  debitBalance: (amount) => {
    set((state) => ({
      user: state.user
        ? { ...state.user, balance: state.user.balance - amount }
        : null,
    }));
  },

  cashOut: async (accessToken: string) => {
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

    try {
      const multiplier = currentRound.multiplier || 1;
      const winAmount = (myBet.amount / 100) * multiplier;

      //enviar para api
      const { response } = await apiFetch("game", `/games/bet/cashout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          betId: myBet.id,
        },
      });

      if (!response.success) {
        set({ error: response.error.message });
        return;
      }

      get().updateBet(myBet.id, {
        status: "cashed_out",
        multiplier,
        cashedOutAt: new Date(),
      });

      get().updateBalance((user?.balance || 0) + winAmount);
    } catch {
      set({ error: "Erro ao sacar" });
    } finally {
      set({ isLoading: false });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

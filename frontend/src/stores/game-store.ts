import { ApiPagination } from "./../types/api";
import { create } from "zustand";
import { Bet, CurrentRound, GameState, User } from "@/types/games";
import { apiFetch } from "@/app/_lib/api";
import { BetHistory } from "@/types/bet";
import { RoundHistory } from "@/types/round";

interface GameActions {
  placeBet: (amount: number) => Promise<void>;
  cashOut: () => Promise<void>;
  setCurrentRound: (round: CurrentRound) => void;
  replaceRoundHistory: (round: ApiPagination<RoundHistory[]>) => void;
  updateMultiplier: (multiplier: number) => void;
  addBet: (bet: Bet) => void;
  updateBet: (betId: string, updates: Partial<Bet>) => void;
  clearBets: () => void;
  setUser: (user: User | null) => void;
  updateBalance: (newBalance: number) => void;
  debitBalance: (amount: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  replaceMyBetHistory: (history: ApiPagination<BetHistory>) => void;
}

const initialState: GameState = {
  currentRound: null,
  myBet: null,
  currentBets: [],
  roundHistory: {
    data: [],
    page: 0,
    limit: 0,
    total: 0,
    totalPages: 0,
  },
  user: null,
  isLoading: false,
  error: null,
  myBetHistory: {
    data: {
      bets: [],
      totalBetsAmount: 0,
      totalProfit: 0,
      successRate: 0,
    },
    page: 0,
    limit: 0,
    total: 0,
    totalPages: 0,
  },
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,
  replaceMyBetHistory: (history) => set({ myBetHistory: history }),
  replaceRoundHistory: (roundHistory: ApiPagination<RoundHistory[]>) =>
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
  setCurrentRound: (round) => {
    const { user } = get();
    set({
      currentRound: round,
      currentBets: round.bets,
      myBet: round.bets.find((bet) => bet.userId === user?.id),
    });
  },

  updateMultiplier: (multiplier) =>
    set((state) => ({
      currentRound: state.currentRound
        ? { ...state.currentRound, multiplier }
        : null,
    })),

  addBet: (bet) => {
    const { user } = get();
    set((state) => ({
      currentBets: [...state.currentBets, bet],
      ...(bet.userId === user?.id && { myBet: bet }),
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

    try {
      set({ isLoading: true });
      const { response } = await apiFetch<{
        bet: Bet;
        newBalance: number;
        roundId: string;
      }>("game", `/games/bet`, {
        method: "POST",
        data: {
          amount: amount * 100,
          roundId: currentRound.id,
        },
      });

      if (!response.success) throw new Error(response.error.message);

      const { data } = response;

      const newBet: Bet & { username: string } = {
        id: data.bet.id,
        roundId: data.roundId,
        userId: user.id,
        username: user.username,
        amount: data.bet.amount * 100,
        multiplier: data.bet.multiplier,
        status: data.bet.status,
        cashedOutAt: data.bet.cashedOutAt,
        createdAt: data.bet.createdAt,
      };

      get().addBet(newBet);
      get().debitBalance(amount);
      set({ isLoading: false });
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

    try {
      const multiplier = currentRound.multiplier || 1;
      const winAmount = (myBet.amount / 100) * multiplier;

      const { response } = await apiFetch("game", `/games/bet/cashout`, {
        method: "POST",
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
        cashedOutAt: new Date().toISOString(),
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

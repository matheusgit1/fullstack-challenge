// frontend/src/stores/gameStore.ts
import { create } from "zustand";
import { GameState, Round, Bet, User, RoundHistory } from "@/types/games";

interface GameActions {
  placeBet: (amount: number) => Promise<void>;
  cashOut: () => Promise<void>;
  setCurrentRound: (round: Round) => void;
  updateMultiplier: (multiplier: number) => void;
  addBet: (bet: Bet) => void;
  updateBet: (betId: string, updates: Partial<Bet>) => void;
  clearBets: () => void;
  setUser: (user: User | null) => void; // Permite null
  updateBalance: (newBalance: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  syncWithSession: (session: any) => void; // Nova ação
}

const initialState: GameState = {
  currentRound: null,
  myBet: null,
  currentBets: [],
  roundHistory: [],
  user: {
    id: "mocked",
    username: "User mocked da silva",
    balance: 50000,
  }, // Começa como null
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  updateBalance: (newBalance) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance: newBalance } : null,
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

    // Buscar token da sessão para enviar ao backend
    const { data: session } = await import("next-auth/react").then((mod) =>
      mod.useSession(),
    );

    try {
      // Simular chamada à API com autenticação
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
    } catch (error) {
      set({ error: "Erro ao fazer aposta" });
    } finally {
      set({ isLoading: false });
    }
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
    } catch (error) {
      set({ error: "Erro ao sacar" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Nova ação para sincronizar com a sessão do NextAuth
  syncWithSession: (session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id || session.user.sub || session.user.email,
        username:
          session.user.name || session.user.email?.split("@")[0] || "Player",
        balance: 5000, // Buscar do backend depois
      };
      set({ user });
    } else {
      set({ user: null });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
